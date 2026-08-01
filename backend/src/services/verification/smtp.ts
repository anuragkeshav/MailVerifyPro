import net from 'net';
import tls from 'tls';

export interface SmtpResponse {
  code: number;
  message: string;
  accepted: boolean;
}

/**
 * Helper to read exactly one full SMTP response (handles multi-line responses).
 * @param socket The TCP or TLS socket.
 * @returns A promise that resolves to the raw SMTP response string.
 */
function readSmtpResponse(socket: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    const onData = (chunk: Buffer) => {
      data += chunk.toString();
      const lines = data.split('\r\n');
      if (lines.length > 1) {
        const lastLine = lines[lines.length - 2]; // Empty string is at lines.length - 1 due to trailing \r\n
        // Check if the 4th character is a space, denoting the final line of an SMTP response
        if (lastLine.length >= 4 && lastLine.charAt(3) === ' ') {
          socket.removeListener('data', onData);
          socket.removeListener('error', onError);
          resolve(data);
        }
      }
    };

    const onError = (err: Error) => {
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      reject(err);
    };

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

/**
 * Verifies an email address by connecting to its MX host via SMTP.
 * @param email The email address to verify.
 * @param mxHost The MX host to connect to.
 * @param timeout Timeout in milliseconds.
 * @returns A promise resolving to the SmtpResponse.
 */
export async function smtpVerify(email: string, mxHost: string, timeout = 10000): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let socket: net.Socket = new net.Socket();
    let isFinished = false;

    const cleanup = () => {
      if (!isFinished) {
        socket.destroy();
        isFinished = true;
      }
    };

    const finish = (code: number, message: string, accepted: boolean) => {
      cleanup();
      resolve({ code, message, accepted });
    };

    const fail = (err: any) => {
      cleanup();
      reject(err);
    };

    socket.setTimeout(timeout);
    socket.on('timeout', () => {
      fail(new Error('ETIMEDOUT'));
    });
    socket.on('error', (err) => {
      fail(err);
    });

    socket.connect(25, mxHost, async () => {
      try {
        let response = await readSmtpResponse(socket);
        if (!response.startsWith('220')) {
          return finish(parseInt(response.substring(0, 3)) || 500, response.trim(), false);
        }

        socket.write('EHLO localhost\r\n');
        response = await readSmtpResponse(socket);
        if (!response.startsWith('250')) {
          return finish(parseInt(response.substring(0, 3)) || 500, response.trim(), false);
        }

        const supportsStartTls = response.toLowerCase().includes('starttls');
        if (supportsStartTls) {
           socket.write('STARTTLS\r\n');
           response = await readSmtpResponse(socket);
           if (response.startsWith('220')) {
               socket.removeAllListeners('data');
               socket.removeAllListeners('error');
               socket.removeAllListeners('timeout');
               
               const secureSocket = tls.connect({
                 socket: socket,
                 rejectUnauthorized: false
               });
               
               socket = secureSocket as net.Socket;
               socket.setTimeout(timeout);
               socket.on('timeout', () => fail(new Error('ETIMEDOUT')));
               socket.on('error', (err) => fail(err));
               
               socket.write('EHLO localhost\r\n');
               response = await readSmtpResponse(socket);
               if (!response.startsWith('250')) {
                  return finish(parseInt(response.substring(0, 3)) || 500, response.trim(), false);
               }
           }
        }

        socket.write('MAIL FROM:<verify@localhost>\r\n');
        response = await readSmtpResponse(socket);
        if (!response.startsWith('250')) {
          const code = parseInt(response.substring(0, 3)) || 500;
          return finish(code, response.trim(), false);
        }

        socket.write(`RCPT TO:<${email}>\r\n`);
        response = await readSmtpResponse(socket);
        
        socket.write('QUIT\r\n');
        
        const code = parseInt(response.substring(0, 3)) || 500;
        const accepted = code === 250 || code === 251;
        
        finish(code, response.trim(), accepted);

      } catch (err) {
        fail(err);
      }
    });
  });
}
