import { ModuleRegistrationName } from "@medusajs/modules-sdk"
import { ICartModuleService, IPromotionModuleService } from "@medusajs/types"
import { PromotionType } from "@medusajs/utils"
import path from "path"
import { startBootstrapApp } from "../../../../environment-helpers/bootstrap-app"
import { useApi } from "../../../../environment-helpers/use-api"
import { getContainer } from "../../../../environment-helpers/use-container"
import { initDb, useDb } from "../../../../environment-helpers/use-db"
import adminSeeder from "../../../../helpers/admin-seeder"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }

describe("Store Carts API: Remove promotions from cart", () => {
  let dbConnection
  let appContainer
  let shutdownServer
  let cartModuleService: ICartModuleService
  let promotionModuleService: IPromotionModuleService

  beforeAll(async () => {
    const cwd = path.resolve(path.join(__dirname, "..", "..", ".."))
    dbConnection = await initDb({ cwd, env } as any)
    shutdownServer = await startBootstrapApp({ cwd, env })
    appContainer = getContainer()
    cartModuleService = appContainer.resolve(ModuleRegistrationName.CART)
    promotionModuleService = appContainer.resolve(
      ModuleRegistrationName.PROMOTION
    )
  })

  afterAll(async () => {
    const db = useDb()
    await db.shutdown()
    await shutdownServer()
  })

  beforeEach(async () => {
    await adminSeeder(dbConnection)
  })

  afterEach(async () => {
    const db = useDb()
    await db.teardown()
  })

  describe("DELETE /store/carts/:id/promotions", () => {
    it("should remove line item adjustments from a cart based on promotions", async () => {
      const appliedPromotion = await promotionModuleService.create({
        code: "PROMOTION_APPLIED",
        type: PromotionType.STANDARD,
        application_method: {
          type: "fixed",
          target_type: "items",
          allocation: "each",
          value: "300",
          apply_to_quantity: 1,
          max_quantity: 1,
          target_rules: [
            {
              attribute: "product_id",
              operator: "eq",
              values: "prod_tshirt",
            },
          ],
        },
      })

      const appliedPromotionToRemove = await promotionModuleService.create({
        code: "PROMOTION_APPLIED_TO_REMOVE",
        type: PromotionType.STANDARD,
        application_method: {
          type: "fixed",
          target_type: "items",
          allocation: "each",
          value: "300",
          apply_to_quantity: 1,
          max_quantity: 1,
          target_rules: [
            {
              attribute: "product_id",
              operator: "eq",
              values: "prod_tshirt",
            },
          ],
        },
      })

      const cart = await cartModuleService.create({
        currency_code: "usd",
        items: [
          {
            id: "item-1",
            unit_price: 2000,
            quantity: 1,
            title: "Test item",
            product_id: "prod_mat",
          } as any,
          {
            id: "item-2",
            unit_price: 1000,
            quantity: 1,
            title: "Test item",
            product_id: "prod_tshirt",
          } as any,
        ],
      })

      const [adjustment1, adjustment2] =
        await cartModuleService.addLineItemAdjustments([
          {
            code: appliedPromotion.code!,
            amount: 300,
            item_id: "item-2",
            promotion_id: appliedPromotionToRemove.id,
          },
          {
            code: appliedPromotionToRemove.code!,
            amount: 150,
            item_id: "item-1",
            promotion_id: appliedPromotionToRemove.id,
          },
          {
            code: appliedPromotionToRemove.code!,
            amount: 150,
            item_id: "item-2",
            promotion_id: appliedPromotionToRemove.id,
          },
        ])

      const api = useApi() as any

      const response = await api.delete(`/store/carts/${cart.id}/promotions`, {
        data: {
          promo_codes: [appliedPromotionToRemove.code],
        },
      })

      expect(response.status).toEqual(200)
      expect(response.data.cart).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "item-1",
              adjustments: [],
            }),
            expect.objectContaining({
              id: "item-2",
              adjustments: [
                expect.objectContaining({
                  amount: 300,
                  code: appliedPromotion.code,
                }),
              ],
            }),
          ]),
        })
      )
    })

    it("should add shipping method adjustments to a cart based on promotions", async () => {
      const appliedPromotion = await promotionModuleService.create({
        code: "PROMOTION_APPLIED",
        type: PromotionType.STANDARD,
        rules: [
          {
            attribute: "customer_id",
            operator: "in",
            values: ["cus_test"],
          },
          {
            attribute: "currency_code",
            operator: "in",
            values: ["eur"],
          },
        ],
        application_method: {
          type: "fixed",
          target_type: "shipping_methods",
          allocation: "each",
          value: "100",
          max_quantity: 1,
          target_rules: [
            {
              attribute: "name",
              operator: "in",
              values: ["express"],
            },
          ],
        },
      })

      const appliedPromotionToRemove = await promotionModuleService.create({
        code: "PROMOTION_APPLIED_TO_REMOVE",
        type: PromotionType.STANDARD,
        rules: [
          {
            attribute: "customer_id",
            operator: "in",
            values: ["cus_test"],
          },
          {
            attribute: "currency_code",
            operator: "in",
            values: ["eur"],
          },
        ],
        application_method: {
          type: "fixed",
          target_type: "shipping_methods",
          allocation: "each",
          value: "100",
          max_quantity: 1,
          target_rules: [
            {
              attribute: "name",
              operator: "in",
              values: ["express"],
            },
          ],
        },
      })

      const cart = await cartModuleService.create({
        currency_code: "eur",
        customer_id: "cus_test",
        items: [
          {
            unit_price: 2000,
            quantity: 1,
            title: "Test item",
            product_id: "prod_mat",
          },
        ],
      })

      const [express, standard] = await cartModuleService.addShippingMethods(
        cart.id,
        [
          {
            amount: 500,
            name: "express",
          },
          {
            amount: 500,
            name: "standard",
          },
        ]
      )

      await cartModuleService.addShippingMethodAdjustments(cart.id, [
        {
          shipping_method_id: express.id,
          amount: 100,
          code: appliedPromotion.code!,
        },
        {
          shipping_method_id: express.id,
          amount: 100,
          code: appliedPromotionToRemove.code!,
        },
      ])

      const api = useApi() as any

      const response = await api.delete(`/store/carts/${cart.id}/promotions`, {
        data: { promo_codes: [appliedPromotionToRemove.code] },
      })

      expect(response.status).toEqual(200)
      expect(response.data.cart).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
            }),
          ]),
          shipping_methods: expect.arrayContaining([
            expect.objectContaining({
              id: express.id,
              adjustments: [
                expect.objectContaining({
                  amount: 100,
                  code: appliedPromotion.code,
                }),
              ],
            }),
            expect.objectContaining({
              id: standard.id,
              adjustments: [],
            }),
          ]),
        })
      )
    })
  })
})
