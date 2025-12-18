import Stripe from "stripe";
import { eq, not } from "drizzle-orm";
import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

async function setupStripeProducts() {
  const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY2;
  
  if (!stripeSecretKey) {
    console.error("TESTING_STRIPE_SECRET_KEY2 not found!");
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });

  console.log("Setting up Stripe products in TEST mode...\n");

  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(not(eq(subscriptionPlans.id, "trial")));

    console.log("📋 Creating the following plans:");
    for (const plan of plans) {
      console.log(
        `  • ${plan.name}: $${(plan.priceCents || 0) / 100}/month (${plan.booksPerMonth} books)`,
      );
    }
    console.log();

    const priceIds: Record<string, string> = {};

    for (const plan of plans) {
      console.log(`Creating product for: ${plan.name} (${plan.id})`);
      
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${plan.name}'`,
      });

      let product;
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`  ✓ Product already exists: ${product.id}`);
      } else {
        // Create product with detailed description
        const features: string[] = [];
        features.push(`${plan.booksPerMonth} books per month`);
        features.push(`${plan.templateBooks} template books`);
        features.push(`${plan.bonusVariations} bonus illustration variations`);
        if (plan.commercialRights) features.push('Full commercial rights');
        if (plan.resellRights) features.push('Commercial resell rights');
        if (plan.allFormattingOptions) features.push('All formatting options');
        
        product = await stripe.products.create({
          name: plan.name,
          description: `${plan.name} subscription - ${features.join(", ")}`,
        });
        console.log(`  ✓ Created product: ${product.id}`);
      }

      // Check if price already exists
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      let price;
      if (existingPrices.data.length > 0) {
        price = existingPrices.data[0];
        console.log(`  ✓ Price already exists: ${price.id} ($${(plan.priceCents || 0) / 100}/month)`);
      } else {
        // Create price
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceCents,
          currency: "usd",
          recurring: {
            interval: "month",
          },
        });
        console.log(
          `  ✓ Created price: ${price.id} ($${(plan.priceCents || 0) / 100}/month)`,
        );
      }

      priceIds[plan.id] = price.id;
      console.log();
    }

    console.log("✅ All Stripe products and prices created successfully!");
    console.log("\n💳 You can now test payments with these test cards:");
    console.log("  • Success: 4242 4242 4242 4242");
    console.log("  • Decline: 4000 0000 0000 0002");
    console.log("  • Use any future expiry date and any 3-digit CVC");
    
  } catch (error) {
    console.error("Error setting up Stripe products:", error);
    process.exit(1);
  }
}

setupStripeProducts();
