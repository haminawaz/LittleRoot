import "dotenv/config";
import { eq, and, not } from "drizzle-orm";
import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

async function getPayPalAccessToken(
  baseUrl: string,
  clientId: string,
  secret: string
) {
  const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString(
        "base64"
      )}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(
      `Failed to get PayPal access token: ${tokenResponse.status} ${errorText}`
    );
  }

  const { access_token } = (await tokenResponse.json()) as {
    access_token: string;
  };
  return access_token;
}

async function findOrCreatePayPalProduct(
  baseUrl: string,
  accessToken: string,
  planName: string
) {
  const listResponse = await fetch(
    `${baseUrl}/v1/catalogs/products?page_size=20&total_required=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(
      `Failed to list PayPal products: ${listResponse.status} ${errorText}`
    );
  }

  const listData = (await listResponse.json()) as { products?: any[] };
  const existingProduct = listData.products?.find(
    (p) => p.custom_id === `plan_${planName}`
  );
  if (existingProduct) {
    console.log(`  ✓ PayPal product already exists: ${existingProduct.id}`);
    return existingProduct;
  }

  const createResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: planName,
      description: `${planName} subscription for LittleRoot`,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(
      `Failed to create PayPal product: ${createResponse.status} ${errorText}`
    );
  }

  const product = await createResponse.json();
  console.log(`  ✓ Created PayPal product: ${product.id}`);
  return product;
}

async function findOrCreatePayPalPlan(
  baseUrl: string,
  accessToken: string,
  productId: string,
  plan: typeof subscriptionPlans.$inferSelect
) {
  const listResponse = await fetch(
    `${baseUrl}/v1/billing/plans?product_id=${encodeURIComponent(
      productId
    )}&page_size=20&total_required=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(
      `Failed to list PayPal plans: ${listResponse.status} ${errorText}`
    );
  }

  const listData = (await listResponse.json()) as { plans?: any[] };
  const existingPlan = listData.plans?.find(
    (p) =>
      p.name === `${plan.name} Monthly` &&
      p.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value === priceValue
  );
  if (existingPlan) {
    console.log(`  ✓ PayPal billing plan already exists: ${existingPlan.id}`);
    return existingPlan;
  }

  const priceValue = ((plan.priceCents || 0) / 100).toFixed(2);

  const createResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: `${plan.name} Monthly`,
      description: `${plan.name} monthly subscription`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite (until canceled)
          pricing_scheme: {
            fixed_price: {
              value: priceValue,
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: "0",
        inclusive: false,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(
      `Failed to create PayPal billing plan: ${createResponse.status} ${errorText}`
    );
  }

  const createdPlan = await createResponse.json();
  console.log(`  ✓ Created PayPal billing plan: ${createdPlan.id}`);

  // Newly created plans are usually in CREATED state; activate them
  const activateResponse = await fetch(
    `${baseUrl}/v1/billing/plans/${encodeURIComponent(
      createdPlan.id
    )}/activate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!activateResponse.ok) {
    const errorText = await activateResponse.text();
    throw new Error(
      `Failed to activate PayPal billing plan ${createdPlan.id}: ${activateResponse.status} ${errorText}`
    );
  }

  console.log(`  ✓ Activated PayPal billing plan: ${createdPlan.id}`);
  return createdPlan;
}

async function setupPayPalProducts() {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalSecret = process.env.PAYPAL_SECRET;
  const paypalMode = process.env.PAYPAL_MODE;

  if (!paypalClientId || !paypalSecret) {
    console.error(
      "PAYPAL_CLIENT_ID or PAYPAL_SECRET not found in environment variables!"
    );
    process.exit(1);
  }

  const paypalBaseUrl =
    paypalMode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  console.log("Setting up PayPal products and subscription plans...\n");

  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(
        and(
          not(eq(subscriptionPlans.id, "trial")),
          eq(subscriptionPlans.isActive, true)
        )
      );

    if (!plans.length) {
      console.log(
        "No active subscription plans found (excluding trial). Nothing to do."
      );
      return;
    }

    console.log("📋 Creating PayPal products and plans for:");
    for (const plan of plans) {
      console.log(
        `  • ${plan.name}: $${(plan.priceCents || 0) / 100}/month (${
          plan.booksPerMonth
        } books)`
      );
    }
    console.log();

    const accessToken = await getPayPalAccessToken(
      paypalBaseUrl,
      paypalClientId,
      paypalSecret
    );

    for (const plan of plans) {
      console.log(`Processing plan: ${plan.name} (${plan.id})`);

      const product = await findOrCreatePayPalProduct(
        paypalBaseUrl,
        accessToken,
        plan.name
      );
      const paypalPlan = await findOrCreatePayPalPlan(
        paypalBaseUrl,
        accessToken,
        product.id,
        plan
      );

      if (plan.paypalPlanId && plan.paypalPlanId === paypalPlan.id) {
        console.log(
          `  ✓ Database already has PayPal plan ID: ${plan.paypalPlanId}`
        );
      } else {
        await db
          .update(subscriptionPlans)
          .set({ paypalPlanId: paypalPlan.id })
          .where(eq(subscriptionPlans.id, plan.id));
        console.log(`  ✓ Saved PayPal plan ID to database: ${paypalPlan.id}`);
      }

      console.log();
    }

    console.log(
      "✅ All PayPal products and billing plans are set up and linked to your plans."
    );
    console.log(
      "\n💳 You can now use these PayPal plans with the PayPal JS SDK (subscription.create with plan_id)."
    );
  } catch (error) {
    console.error("Error setting up PayPal products and plans:", error);
    process.exit(1);
  }
}

setupPayPalProducts();
