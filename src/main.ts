import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- YE LINE ADD KAREIN (Integration ke liye zaroori hai) ---
  app.enableCors(); 
  // ---------------------------------------------------------

  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Port check karein, default 3000 hota hai
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`[HTTP] listening on ${process.env.PORT ?? 3000}`);
}
bootstrap();