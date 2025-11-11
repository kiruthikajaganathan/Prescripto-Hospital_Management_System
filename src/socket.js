export function setupSocket(io) {
	io.on('connection', (socket) => {
		// expect client to send userId to join personal room
		socket.on('auth:identify', (userId) => {
			if (userId) {
				socket.join(String(userId));
			}
		});
	});
}


