const errorHandler = (err, req, res, next) => {
  if (err?.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large'
        : err.message

    return res.status(400).json({
      success: false,
      message,
    })
  }

  if (
    err?.message === 'Only image uploads are allowed' ||
    err?.message === 'Invalid note file type' ||
    err?.message === 'Invalid cover image type' ||
    err?.message === 'Unsupported upload field'
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500

  // Always log detailed error server-side; never expose stack traces to clients.
  console.error(err)

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500 ? 'Internal server error' : err?.message || 'Request failed',
  })
}

export default errorHandler
