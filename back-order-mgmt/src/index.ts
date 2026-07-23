import pg from "pg";
import { connect } from "nats";
import type { NatsConnection } from "nats";

import { DatabaseMigrator, PostgresRepository } from "./infrastructure/index.js";

import { OrderService } from "./core/Services/index.js";

import { OrderNatsController } from "./controllers/OrderNatsController.js";
import type { IOrderController } from "./controllers/Contracts/Interfaces/IOrderController.js";

const { Pool } = pg;

async function bootstrap() {
    console.log("Running service back-orders-mgmt (Node.js/TypeScript)...");

    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'admin',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'order_warehaouse_db'
    });

    try {
        console.log("Start migration DB...");
        const migrator = new DatabaseMigrator(pool);
        await migrator.migrateUp();
        console.log("DB is ready.");

        const natsUrl = process.env.NATS_URL || "nats://127.0.0.1:4222";
        const nc: NatsConnection = await connect( { servers: natsUrl });
        console.log(`Connected to NATS server: ${natsUrl}`);

        //Infrastracture layer
        const orderRepository = new PostgresRepository(pool);
        
        //Core layer
        const orderService = new OrderService(orderRepository);

        //Controllers layer
        const natsController : IOrderController = new OrderNatsController(nc, orderService);

        await natsController.startListening();
    } catch (err) {
        console.error(`Critical error during run server: ${err}`);
        process.exit(1);
    }
}

bootstrap().catch(console.error);