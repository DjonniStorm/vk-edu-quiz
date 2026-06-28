import { InMemoryRealtimeGateway } from "./realtime.gateway";
import { createRealtimeRoutes } from "./realtime.routes";

export const createRealtimeModule = () => {
  const realtimeGateway = new InMemoryRealtimeGateway();
  const routes = createRealtimeRoutes({ realtimeGateway });

  return {
    realtimeGateway,
    routes,
  };
};
