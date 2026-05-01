import Order from "../models/order.js";
import Product from "../models/product.js";
import { isItAdmin, isItCustomer } from "./userController.js";

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calculateRentalDays(startingDate, endingDate) {
  const start = parseDateValue(startingDate);
  const end = parseDateValue(endingDate);

  if (!start || !end) {
    return null;
  }

  const diffInMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return days > 0 ? days : null;
}

function buildNextOrderId(lastOrderId) {
  if (!lastOrderId) {
    return "ORD0001";
  }

  const lastOrderNumber = Number.parseInt(
    String(lastOrderId).replace("ORD", ""),
    10
  );

  const currentOrderNumber = Number.isFinite(lastOrderNumber)
    ? lastOrderNumber + 1
    : 1;

  return `ORD${String(currentOrderNumber).padStart(4, "0")}`;
}

function normalizeRequestedItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items.map((item) => ({
    key: String(item?.key || "").trim(),
    qty: Number.parseInt(item?.qty, 10),
  }));
}

async function rollbackReservedStock(reservedItems) {
  for (const reservedItem of reservedItems) {
    await Product.updateOne(
      { key: reservedItem.key },
      {
        $inc: { stockCount: reservedItem.qty },
        $set: { availability: true },
      }
    );
  }
}

async function validateOrderPayload(data) {
  const normalizedItems = normalizeRequestedItems(data?.orderedItems);

  if (!normalizedItems) {
    return { error: { status: 400, message: "Please select at least one rental item." } };
  }

  const startingDate = parseDateValue(data?.startingDate);
  const endingDate = parseDateValue(data?.endingDate);
  const days = calculateRentalDays(data?.startingDate, data?.endingDate);

  if (!startingDate || !endingDate) {
    return { error: { status: 400, message: "Please provide valid rental start and end dates." } };
  }

  if (startingDate < getStartOfToday()) {
    return { error: { status: 400, message: "Rental start date cannot be in the past." } };
  }

  if (!days) {
    return { error: { status: 400, message: "Rental start date must be earlier than the end date." } };
  }

  const preparedItems = [];
  let oneDayCost = 0;

  for (const requestedItem of normalizedItems) {
    if (!requestedItem.key) {
      return { error: { status: 400, message: "Each rental item must include a product key." } };
    }

    if (!Number.isInteger(requestedItem.qty) || requestedItem.qty < 1) {
      return {
        error: {
          status: 400,
          message: `Quantity for ${requestedItem.key} must be at least 1.`,
        },
      };
    }

    const product = await Product.findOne({ key: requestedItem.key });

    if (!product) {
      return {
        error: {
          status: 404,
          message: `Product with key ${requestedItem.key} was not found.`,
        },
      };
    }

    if (product.isRentable === false) {
      return {
        error: {
          status: 400,
          message: `${product.name} is not available for rental.`,
        },
      };
    }

    if (product.availability === false || product.stockCount <= 0) {
      return {
        error: {
          status: 400,
          message: `${product.name} is currently out of stock.`,
        },
      };
    }

    if (requestedItem.qty > product.stockCount) {
      return {
        error: {
          status: 400,
          message: `Only ${product.stockCount} unit(s) of ${product.name} are available right now.`,
        },
      };
    }

    preparedItems.push({
      request: requestedItem,
      snapshot: {
        product: {
          key: product.key,
          name: product.name,
          image: product.image?.[0] || "",
          dailyRentalprice: product.dailyRentalprice,
        },
        quantity: requestedItem.qty,
      },
    });

    oneDayCost += product.dailyRentalprice * requestedItem.qty;
  }

  return {
    startingDate,
    endingDate,
    days,
    preparedItems,
    totalAmount: oneDayCost * days,
  };
}

async function reserveStock(preparedItems) {
  const reservedItems = [];

  for (const item of preparedItems) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        key: item.request.key,
        isRentable: { $ne: false },
        availability: true,
        stockCount: { $gte: item.request.qty },
      },
      {
        $inc: { stockCount: -item.request.qty },
      },
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      await rollbackReservedStock(reservedItems);
      return {
        error: {
          status: 400,
          message:
            "One or more selected items no longer have enough stock. Please review your cart and try again.",
        },
      };
    }

    if (updatedProduct.stockCount <= 0) {
      await Product.updateOne(
        { key: updatedProduct.key },
        { $set: { availability: false } }
      );
    }

    reservedItems.push({
      key: item.request.key,
      qty: item.request.qty,
    });
  }

  return { reservedItems };
}

export async function createOrder(req, res) {
  const data = req.body;
  const orderInfo = {
    orderedItems: [],
  };

  if (req.user == null) {
    res.status(401).json({
      message: "Please login and try again",
    });
    return;
  }

  const validationResult = await validateOrderPayload(data);
  if (validationResult.error) {
    res.status(validationResult.error.status).json({
      message: validationResult.error.message,
    });
    return;
  }

  orderInfo.email = req.user.email;
  orderInfo.userId = req.user.userId;

  const lastOrder = await Order.find().sort({ orderDate: -1 }).limit(1);
  orderInfo.orderId = buildNextOrderId(lastOrder[0]?.orderId);

  const stockReservation = await reserveStock(validationResult.preparedItems);
  if (stockReservation.error) {
    res.status(stockReservation.error.status).json({
      message: stockReservation.error.message,
    });
    return;
  }

  orderInfo.orderedItems = validationResult.preparedItems.map((item) => item.snapshot);
  orderInfo.days = validationResult.days;
  orderInfo.startingDate = validationResult.startingDate;
  orderInfo.endingDate = validationResult.endingDate;
  orderInfo.totalAmount = validationResult.totalAmount;
  orderInfo.status = "Pending";
  orderInfo.paymentMethod = data?.paymentMethod || "checkout";
  orderInfo.paymentStatus = data?.paymentStatus || "pending";
  orderInfo.refundStatus = data?.refundStatus || "not_applicable";

  try {
    const newOrder = new Order(orderInfo);
    const result = await newOrder.save();
    res.json({
      message: "Order created successfully",
      order: result,
    });
  } catch (error) {
    await rollbackReservedStock(stockReservation.reservedItems || []);
    console.log(error);
    res.status(500).json({
      message: "Failed to create order",
    });
  }
}

export async function getQuote(req, res) {
  const validationResult = await validateOrderPayload(req.body);

  if (validationResult.error) {
    res.status(validationResult.error.status).json({
      message: validationResult.error.message,
    });
    return;
  }

  res.json({
    message: "Order quotation",
    total: validationResult.totalAmount,
    days: validationResult.days,
  });
}

export async function getOrders(req, res) {
  if (isItCustomer(req)) {
    try {
      const orders = await Order.find({ email: req.user.email }).sort({ orderDate: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to get orders" });
    }
  } else if (isItAdmin(req)) {
    try {
      const orders = await Order.find().sort({ orderDate: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to get orders" });
    }
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}

export async function getOrderById(req, res) {
  const orderId = req.params.orderId;

  try {
    const query = isItAdmin(req)
      ? { orderId }
      : isItCustomer(req)
        ? { orderId, email: req.user.email }
        : null;

    if (!query) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to get order" });
  }
}

export async function cancelOrder(req, res) {
  if (req.user == null) {
    return res.status(401).json({
      message: "Please login and try again",
    });
  }

  try {
    const orderId = req.params.orderId;
    const query = isItAdmin(req)
      ? { orderId }
      : { orderId, $or: [{ userId: req.user.userId }, { email: req.user.email }] };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        message: "This rental order has already been cancelled.",
      });
    }

    if (order.status === "Completed") {
      return res.status(400).json({
        message: "Completed rental orders cannot be cancelled.",
      });
    }

    if (order.status === "Approved" || order.status === "Confirmed") {
      return res.status(400).json({
        message: "Approved rental orders cannot be cancelled by the user.",
      });
    }

    if (new Date() >= new Date(order.startingDate)) {
      return res.status(400).json({
        message: "This rental order can no longer be cancelled because the rental period has started.",
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({
      message: "Rental order cancelled successfully.",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel order",
    });
  }
}

export async function approveOrRejectOrder(req, res) {
  const orderId = req.params.orderId;
  const status = String(req.body.status || "").trim();
  const allowedStatuses = ["Approved", "Pending", "Rejected"];

  if (isItAdmin(req)) {
    try {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid order status supplied" });
      }

      const order = await Order.findOne({
        orderId: orderId,
      });
      if (order == null) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (order.status === status) {
        return res.json({ message: `Order is already marked as ${status}` });
      }
      if (order.status === "Cancelled" || order.status === "Completed") {
        return res.status(400).json({
          error: `Orders marked as ${order.status} cannot be updated from this action`,
        });
      }
      await Order.updateOne(
        {
          orderId: orderId,
        },
        {
          status: status,
        }
      );
      res.json({ message: "Order approved/rejected successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get order" });
    }
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}
