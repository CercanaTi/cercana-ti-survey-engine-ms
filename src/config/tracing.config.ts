import tracer from 'dd-trace';

export function initializeTracing() {
  if (process.env.DD_TRACE_ENABLED === 'true' && process.env.DD_API_KEY) {
    tracer.init({
      env: process.env.DD_ENV || 'development',
      service: process.env.DD_SERVICE || 'cercana-ti-backend',
      version: process.env.DD_VERSION || '1.0.0',
      logInjection: true,
      runtimeMetrics: true,
    });
  }
}

export { tracer };
