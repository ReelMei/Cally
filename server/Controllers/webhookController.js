import { verifyWebhook } from "@clerk/express/webhooks";
import { sql } from "../Config/db.js";

export const handleClerkWebhook = async (req, res) => {
  try {
    console.log("========== CLERK WEBHOOK ==========");

    const evt = await verifyWebhook(req);

    const eventType = evt.type;
    const data = evt.data;

    console.log("Event type:", eventType);
    console.log("User ID:", data.id);
    console.log("Email:", data.email_addresses?.[0]?.email_address);

    console.log("===================================");

    switch (eventType) {
      case "user.created": {
        const userId = data.id;

        const primaryEmail = data.email_addresses?.[0]?.email_address || "";

        const name =
          `${data.first_name || "user"} ${data.last_name || ""}`.trim();

        const image = data.image_url || "";
        const plan = "free";

        await sql`
          INSERT INTO users (id, name, email, image, plan)
          VALUES (
            ${userId},
            ${name},
            ${primaryEmail},
            ${image},
            ${plan}
          )
          ON CONFLICT (email) DO UPDATE SET
            id = EXCLUDED.id,
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            plan = EXCLUDED.plan,
            updated_at = NOW()
        `;

        break;
      }

      case "user.updated": {
        const userId = data.id;

        const primaryEmail = data.email_addresses?.[0]?.email_address || "";

        const name =
          `${data.first_name || "user"} ${data.last_name || ""}`.trim();

        const image = data.image_url || "";

        await sql`
          INSERT INTO users (id, name, email, image)
          VALUES (
            ${userId},
            ${name},
            ${primaryEmail},
            ${image}
          )
          ON CONFLICT (email) DO UPDATE SET
            id = EXCLUDED.id,
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            updated_at = NOW()
        `;

        break;
      }

      case "user.deleted": {
        const userId = data.id;

        if (userId) {
          await sql`
            DELETE FROM users
            WHERE id = ${userId}
          `;
        }

        break;
      }

      default:
        console.log(`Unhandled Clerk webhook type: ${eventType}`);
    }

    return res.status(200).json({
      success: true,
      eventType,
    });
  } catch (error) {
    console.error("Error verifying Clerk webhook:", error.message || error);

    return res.status(400).json({
      error: "Webhook verification failed: " + (error.message || error),
    });
  }
};
