export function notFound(_req, _res, next) {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
}

export function errorHandler(err, _req, res, _next) {
	const status = err.status || err.statusCode || 500;
	const message = err.message || 'Internal Server Error';
	res.status(status).json({ error: message });
}


