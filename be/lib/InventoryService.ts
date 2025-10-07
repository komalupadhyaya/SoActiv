import csv from "csv-parser";
import { Readable } from "stream";
import { Product } from "../models/product.model";
import { Supplier } from "../models/supplier.model";
import { Warehouse } from "../models/warehouse.model";

// Export products to CSV
export const exportToCSV = async (products: any) => {
  const headers = [
    "sku",
    "title",
    "barcode",
    "description",
    "weight_value",
    "weight_unit",
    "length_value",
    "length_unit",
    "width_value",
    "width_unit",
    "height_value",
    "height_unit",
    "carton_weight_value",
    "carton_weight_unit",
    "carton_length_value",
    "carton_length_unit",
    "carton_width_value",
    "carton_width_unit",
    "carton_height_value",
    "carton_height_unit",
    "country_of_origin",
    "hs_code",
    "customs_description",
    "warehouses",
    "emergency_stock_level",
    "moq",
    "production_lead_time",
    "cogs",
    "retail_price",
    "payment_terms",
    "freight_options",
    "quantity",
    "product_type",
    "tags",
    "status",
    "supplier",
  ].join(",");

  const rows = products.map((product: any) => {
    const freightOptions = product.freightOptions
      ? product.freightOptions
          .map((f: any) => `${f.method}:${f.cost}:${f.leadTimeDays}`)
          .join(";")
      : "";

    const warehouses = product.warehouses
      ? product.warehouses.map((w: any) => w.name).join(";")
      : "";

    const tags = product.tags ? product.tags.join(";") : "";

    const supplier = product.supplier ? product.supplier.name : "";

    return [
      product.sku,
      `"${product.title.replace(/"/g, '""')}"`,
      product.barcode,
      `"${(product.description || "").replace(/"/g, '""')}"`,
      product.weight?.value || "",
      product.weight?.unit || "",
      product.length?.value || "",
      product.length?.unit || "",
      product.width?.value || "",
      product.width?.unit || "",
      product.height?.value || "",
      product.height?.unit || "",
      product.cartonWeight?.value || "",
      product.cartonWeight?.unit || "",
      product.cartonLength?.value || "",
      product.cartonLength?.unit || "",
      product.cartonWidth?.value || "",
      product.cartonWidth?.unit || "",
      product.cartonHeight?.value || "",
      product.cartonHeight?.unit || "",
      product.countryOfOrigin,
      product.hsCode,
      `"${(product.customsDescription || "").replace(/"/g, '""')}"`,
      warehouses,
      product.emergencyStockLevel,
      product.moq,
      product.productionLeadTime,
      product.cogs,
      product.retailPrice,
      product.paymentTerms,
      freightOptions,
      product.quantity,
      product.productType,
      tags,
      product.status,
      supplier,
    ].join(",");
  });

  return [headers, ...rows].join("\n");
};

// Import products from CSV
exports.importFromCSV = async (fileBuffer: Buffer) => {
  return new Promise((resolve, reject) => {
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    const stream = Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", async (row) => {
        try {
          // Process freight options
          let freightOptions = [];
          if (row.freight_options) {
            freightOptions = row.freight_options
              .split(";")
              .map((option: any) => {
                const [method, cost, leadTimeDays] = option.split(":");
                return {
                  method,
                  cost: parseFloat(cost) || 0,
                  leadTimeDays: parseInt(leadTimeDays) || 0,
                };
              });
          }

          // Process warehouses (would need to lookup by name)
          let warehouseIds = [];
          if (row.warehouses) {
            const warehouseNames = row.warehouses.split(";");
            const warehouses = await Warehouse.find({
              name: { $in: warehouseNames },
            });
            warehouseIds = warehouses.map((w: any) => w._id);
          }

          // Process supplier (would need to lookup by name)
          let supplierId = null;
          if (row.supplier) {
            const supplier = await Supplier.findOne({ name: row.supplier });
            if (supplier) supplierId = supplier._id;
          }

          const productData = {
            sku: row.sku,
            title: row.title,
            barcode: row.barcode,
            description: row.description,
            weight: row.weight_value
              ? {
                  value: parseFloat(row.weight_value),
                  unit: row.weight_unit || "cm",
                }
              : undefined,
            length: row.length_value
              ? {
                  value: parseFloat(row.length_value),
                  unit: row.length_unit || "cm",
                }
              : undefined,
            width: row.width_value
              ? {
                  value: parseFloat(row.width_value),
                  unit: row.width_unit || "cm",
                }
              : undefined,
            height: row.height_value
              ? {
                  value: parseFloat(row.height_value),
                  unit: row.height_unit || "cm",
                }
              : undefined,
            cartonWeight: row.carton_weight_value
              ? {
                  value: parseFloat(row.carton_weight_value),
                  unit: row.carton_weight_unit || "cm",
                }
              : undefined,
            cartonLength: row.carton_length_value
              ? {
                  value: parseFloat(row.carton_length_value),
                  unit: row.carton_length_unit || "cm",
                }
              : undefined,
            cartonWidth: row.carton_width_value
              ? {
                  value: parseFloat(row.carton_width_value),
                  unit: row.carton_width_unit || "cm",
                }
              : undefined,
            cartonHeight: row.carton_height_value
              ? {
                  value: parseFloat(row.carton_height_value),
                  unit: row.carton_height_unit || "cm",
                }
              : undefined,
            countryOfOrigin: row.country_of_origin,
            hsCode: row.hs_code,
            customsDescription: row.customs_description,
            warehouses: warehouseIds,
            emergencyStockLevel: parseFloat(row.emergency_stock_level) || 0,
            moq: parseFloat(row.moq) || 0,
            productionLeadTime: parseInt(row.production_lead_time) || 0,
            cogs: parseFloat(row.cogs) || 0,
            retailPrice: parseFloat(row.retail_price) || 0,
            paymentTerms: row.payment_terms,
            freightOptions,
            quantity: parseInt(row.quantity) || 0,
            productType: row.product_type || "physical",
            tags: row.tags ? row.tags.split(";").filter((t: any) => t) : [],
            status: row.status || "draft",
            supplier: supplierId,
          };

          // Check if product exists
          const existingProduct = await Product.findOne({
            sku: productData.sku,
          });

          if (existingProduct) {
            // Update existing product
            await Product.findByIdAndUpdate(existingProduct._id, productData);
            results.updated++;
          } else {
            // Create new product
            await new Product(productData).save();
            results.created++;
          }
        } catch (error: any) {
          return results;
        }
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
