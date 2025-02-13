export const defaultStoreCartFields = [
  "id",
  "currency_code",
  "email",
  "created_at",
  "updated_at",
  "items.id",
  "items.created_at",
  "items.updated_at",
  "items.title",
  "items.quantity",
  "items.unit_price",
  "items.adjustments.id",
  "items.adjustments.code",
  "items.adjustments.amount",
  "customer.id",
  "customer.email",
  "shipping_methods.adjustments.id",
  "shipping_methods.adjustments.code",
  "shipping_methods.adjustments.amount",
  "shipping_address.id",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_address.region_code",
  "shipping_address.phone",
  "billing_address.id",
  "billing_address.first_name",
  "billing_address.last_name",
  "billing_address.address_1",
  "billing_address.address_2",
  "billing_address.city",
  "billing_address.postal_code",
  "billing_address.country_code",
  "billing_address.region_code",
  "billing_address.phone",
  "region.id",
  "region.name",
  "region.currency_code",
  "sales_channel_id",
]

export const defaultStoreCartRelations = [
  "items",
  "items.adjustments",
  "region",
  "customer",
  "shipping_address",
  "billing_address",
  "shipping_methods",
  "shipping_methods.adjustments",
]

export const allowedRelations = [
  "items",
  "items.adjustments",
  "region",
  "customer",
  "shipping_address",
  "billing_address",
  "shipping_methods",
  "shipping_methods.adjustments",
  "sales_channel",
]

export const retrieveTransformQueryConfig = {
  defaultFields: defaultStoreCartFields,
  defaultRelations: defaultStoreCartRelations,
  allowedRelations: defaultStoreCartRelations,
  isList: false,
}
