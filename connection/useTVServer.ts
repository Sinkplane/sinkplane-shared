import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import CookieManager from '@preeternal/react-native-cookie-manager';

import { useSession } from '../auth/auth.context';
import { TVCommand, TVDiscoverPayload, TVHeartbeatPayload, TVMessage } from '../types/message.interface';
import { TVDevice } from '../types/tv-device.interface';

const clientId = Crypto.randomUUID();
const deviceInfo: TVDevice = {
  id: clientId,
  name: Device.deviceName ?? `${Device.DeviceType} ${clientId}`,
  platform: Platform.OS as 'tvos' | 'androidtv',
  host: '',
  port: 9999,
  addresses: [],
  lastSeen: new Date(),
};

export function useTVServer() {
  const { token, user, signIn, signOut } = useSession();
  const [server, setServer] = useState<TcpSocket.Server | null>(null);
  const [zeroconf] = useState(() => new Zeroconf());
  const [clients, setClients] = useState<Map<string, TcpSocket.Socket>>(new Map());
  const [receivedMessages, setReceivedMessages] = useState<TVMessage[]>([]);

  const handleMessage = useCallback(
    async (message: TVMessage, socket: TcpSocket.Socket) => {
      switch (message.type) {
        case TVCommand.LOGIN: {
          console.info('[TV Server] Received LOGIN command', message);
          try {
            // The token is a JSON string containing the cookie object
            // Parse it and set it in CookieManager
            const cookieObject = JSON.parse(message.payload.token);

            console.info('[TV Server] Parsed cookie:', {
              value: cookieObject.value.substring(0, 20) + '...',
              expires: cookieObject.expires,
              domain: cookieObject.domain,
            });

            // Set the cookie in CookieManager so fetch can use it automatically
            await CookieManager.set('https://www.floatplane.com', {
              name: 'sails.sid',
              value: cookieObject.value,
              domain: cookieObject.domain || '.floatplane.com',
              path: cookieObject.path || '/',
              expires: cookieObject.expires,
              secure: cookieObject.secure !== false,
              httpOnly: cookieObject.httpOnly !== false,
            });
            console.info('[TV Server] Cookie set in CookieManager');

            // Sign in - store the cookie value and expiration for reference
            signIn({
              token: cookieObject.value,
              user: message.payload.user,
              tokenExpiration: cookieObject.expires,
            });
            console.info('[TV Server] Login successful');
          } catch (error) {
            console.error('[TV Server] Login failed:', error);
          }
          break;
        }
        case TVCommand.LOGOUT: {
          console.info('[TV Server] Received LOGOUT command');
          try {
            // Clear cookies from CookieManager
            await CookieManager.clearAll();
            console.info('[TV Server] Cleared cookies from CookieManager');

            signOut();
            console.info('[TV Server] Logout successful');
          } catch (error) {
            console.error('[TV Server] Logout failed:', error);
          }
          break;
        }
        case TVCommand.HEARTBEAT: {
          console.info('[TV Server] Received heartbeat, sending response');
          const heartbeatResponse: TVHeartbeatPayload = {
            id: Crypto.randomUUID(),
            type: TVCommand.HEARTBEAT,
            payload: { status: 'alive', isLoggedIn: !!token, userId: user?.id },
            timestamp: new Date(),
            from: deviceInfo.id,
          };
          socket.write(JSON.stringify(heartbeatResponse));
          break;
        }
        default:
          console.info('[TV Server] Received unknown message type:', message.type);
          break;
      }
    },
    [signIn, signOut, token, user],
  );

  const publishTVService = useCallback(async () => {
    try {
      zeroconf.publishService('react-native-tv', 'tcp', 'local.', deviceInfo.name, 9999, {
        platform: deviceInfo.platform,
        id: deviceInfo.id,
        capabilities: JSON.stringify(['video', 'audio', 'remote']),
      });
      const address = await Network.getIpAddressAsync();
      console.info(`TV Service published on ${address}:${9999}`);
    } catch (error) {
      console.error('Error publishing service:', error);
    }
  }, [zeroconf]);

  const startTVServer = useCallback(() => {
    const tcpServer = TcpSocket.createServer(async socket => {
      const socketId = Crypto.randomUUID();
      console.info(`[TV Server] Client connected: ${socketId}`);

      setClients(prev => new Map(prev).set(socketId, socket));

      const address = await Network.getIpAddressAsync();
      console.info(`[TV Server] Device IP address: ${address}`, token, user);
      const discoverMessage: TVDiscoverPayload = {
        id: Crypto.randomUUID(),
        type: TVCommand.DISCOVER,
        payload: {
          ...deviceInfo,
          addresses: [address],
          isLoggedIn: !!token,
          userId: user?.id,
        },
        timestamp: new Date(),
        from: deviceInfo.id,
      };

      console.info('[TV Server] Sending discover message...');
      socket.write(JSON.stringify(discoverMessage));

      socket.on('data', data => {
        try {
          console.info('[TV Server] Data received from client');
          const message: TVMessage = JSON.parse(data.toString());
          console.info('[TV Server] Parsed message:', message);
          setReceivedMessages(prev => [...prev, message]);
          handleMessage(message, socket);
        } catch (error) {
          console.error('[TV Server] Error parsing message:', error);
        }
      });

      socket.on('error', error => console.error('[TV Server] Socket error:', error));

      socket.on('close', () => {
        console.info(`[TV Server] Client disconnected: ${socketId}`);
        setClients(prev => {
          const newClients = new Map(prev);
          newClients.delete(socketId);
          return newClients;
        });
      });
    });

    tcpServer.listen({ port: 9999, host: '0.0.0.0' }, () => {
      console.info('TV Server listening on port 9999');
      setServer(tcpServer);
      publishTVService();
    });

    return tcpServer;
  }, [handleMessage, publishTVService]);

  const stopTVServer = useCallback(() => {
    try {
      console.info('[TV Server] Stopping TV server...');
      zeroconf.unpublishService(deviceInfo.name);
      zeroconf.stop();
      server?.close();
      clients.forEach(client => client.destroy());
      console.info('[TV Server] TV server stopped');
    } catch (error) {
      console.error('[TV Server] Error stopping TV server:', error);
    }
  }, [clients, server, zeroconf]);

  useEffect(() => {
    console.info('[TV Server] useTVServer useEffect mounting');
    startTVServer();
    return () => {
      console.info('[TV Server] useTVServer useEffect unmounting');
      stopTVServer();
    };
  }, []);

  return { receivedMessages };
}
