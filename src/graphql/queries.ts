// ─── Auth ────────────────────────────────────────────────────────────────────

export const VERIFY_NUMBER_MUTATION = `
  mutation verifyNumber($phone: String!, $retry: Boolean!, $retryType: String!, $appHash: String!, $udid: String!) {
    verifyPhoneNumber(
      phone: $phone
      retry: $retry
      retryType: $retryType
      appHash: $appHash
      udid: $udid
    ) {
      status
      error
      errorMsg
      otpBlockTime
      errorData {
        phone
        address
      }
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation login($phone: String!, $otp: String!, $appVersion: String!, $binaryVersion: String!, $source: String!, $deviceDetail: DeviceDetailInput) {
    login(
      phone: $phone
      otp: $otp
      appVersion: $appVersion
      binaryVersion: $binaryVersion
      source: $source
      deviceDetail: $deviceDetail
    ) {
      status
      authExpiry
      authKey
      errorMsg
      refreshKey
    }
  }
`;

// ─── User ─────────────────────────────────────────────────────────────────────

export const FETCH_USER_DETAILS_QUERY = `
  query fetchUserDetails {
    getUserDetails {
      user {
        id
        name
        email
        phone
        walletFreeze
        paid
        firstOrderDate
        referralCode
        deliveryStartDate
        accountStatus
        address {
          cityId
          cityName
          hubId
          line1
          line2
          fullAddress
          status
        }
      }
    }
  }
`;

export const FETCH_USER_BALANCE_QUERY = `
  query fetchUserBalance {
    getUserBalance {
      value
      amount
      valueType
      badge
      badgeColour
      wallet {
        foodCredits
        foodCreditsValue
        mainCredits
        mainCreditsValue
        cashbackCredits
        cashbackCreditsValue
      }
    }
  }
`;

// ─── Basket ───────────────────────────────────────────────────────────────────

export const FETCH_BASKET_QUERY = `
  query fetchBasket {
    getPrunedBasket {
      id
      date
      quantity
      isOtdf
      products {
        id
        price {
          currency
          price {
            amount
            value
          }
        }
        order {
          productId
          quantity
        }
        category {
          id
          subCategory {
            id
          }
        }
        type
        assets {
          image {
            url
          }
        }
      }
      billDetails {
        total
        totalAmount
        subTotal
        subTotalAmount
        subSavings
        subSavingsAmount
        netSubTotal
        netSubTotalAmount
        cashbackUsed
        cashbackUsedAmount
        productDiscount {
          label
          amount
        }
        coupon {
          name
          label
          amount
        }
        offerDiscount {
          label
          amount
        }
      }
    }
  }
`;

// ─── Collections ──────────────────────────────────────────────────────────────

export const GET_HERO_COLLECTION_QUERY = `
  query getHeroCollection($appVersion: String!, $inviteCode: String) {
    getHeroCollection(appVersion: $appVersion, inviteCode: $inviteCode) {
      collection {
        id
        name
        title
        subtitle
        position
        order
        showViewAll
        badge
        leafId
        listId
        adhoc
        target
        hasChildren
        expires
        design {
          displayType
          bgColor
          template
        }
      }
    }
  }
`;

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Shared fragment used by both getMegaFlashDealProducts and getSearchProducts.
 * Defined separately so it can be composed into each query string.
 */
const PRODUCT_DOSSIER_FRAGMENT = `
  fragment ProductDossierFragment on ProductDossier {
    product {
      id
      name
      type
      badge
      kind
      stickerType
      category {
        id
        name
        subCategory {
          id
          name
          type
          typeId
          pTypeId
        }
      }
      delivery {
        type
        slot
        plusOne
      }
      availability {
        isOos
        oos
        forcedOos
        schedule
        maxQuantity
        cutOff {
          time
          text
        }
        refill {
          text
          type
          date
        }
      }
      assets {
        image {
          url
          type
        }
        video {
          url
          type
          mediaType
        }
      }
      weight {
        text
        value
        unit
      }
      price {
        currency
        perUnit
        discount {
          amount
          value
          percent
          text
          displayValue
        }
        dealDiscount {
          amount
          value
          percent
          text
        }
        mbeyond {
          amount
          value
        }
        mrp {
          amount
          value
        }
        price {
          amount
          value
        }
      }
      token
      offers {
        count
        label
      }
    }
    variant {
      id
      active
      products {
        id
        name
        weight {
          text
          value
          unit
        }
        price {
          currency
          mrp {
            amount
            value
          }
          price {
            amount
            value
          }
        }
        availability {
          isOos
          oos
          maxQuantity
        }
      }
    }
  }
`;

export const GET_MEGA_FLASH_DEAL_QUERY = `
  query getMegaFlashDeal($id: Float!) {
    getMegaFlashDeal(id: $id) {
      id
      title
      description
      maxQtyLabel
      movLabel
      dealStatusLabel
      availedQuantity
      subtitleValues {
        key
        value
      }
      status
      serverCurrentTime
      startTime
      endTime
      mov
      maxQty
      listId
      isMovReached
      basketValue
      headerImage
      backgroundImage
      percentage
    }
  }
`;

export const GET_MEGA_FLASH_DEAL_PRODUCTS_QUERY = `
  query getMegaFlashDealProducts($listId: String!, $page: PaginationInput!, $showInStockOnly: Boolean) {
    getMegaFlashDealProducts(
      listId: $listId
      page: $page
      showInStockOnly: $showInStockOnly
    ) {
      products {
        ...ProductDossierFragment
      }
      config {
        layout
        design {
          rows
          showAvailability
          showDiscount
          showDealDiscount
          showSubscribe
          showCounter
        }
      }
      pages {
        limit
        page
        hasNextPage
        records
        pages
      }
    }
  }
  ${PRODUCT_DOSSIER_FRAGMENT}
`;

// ─── Extended Basket ──────────────────────────────────────────────────────────

export const GET_EXTENDED_BASKET_QUERY = `
  query getExtendedBasket($basketId: Float, $isOtdf: Float) {
    getExtendedBasket(basketId: $basketId, isOtdf: $isOtdf) {
      basket {
        id
        date
        quantity
        saving
        taxes
        total
        data {
          key
          title
          type
          data {
            product {
              id
              name
              type
              kind
              weight {
                text
                value
                unit
              }
              price {
                currency
                perUnit
                discount {
                  amount
                  value
                  percent
                  text
                  displayValue
                }
                dealDiscount {
                  amount
                  value
                  percent
                  text
                }
                mbeyond {
                  amount
                  value
                }
                mrp {
                  amount
                  value
                }
                price {
                  amount
                  value
                }
              }
              availability {
                isOos
                oos
                maxQuantity
                cutOff {
                  time
                  text
                }
              }
              assets {
                image {
                  url
                  type
                }
              }
              category {
                id
                name
                subCategory {
                  id
                  name
                  type
                }
              }
              order {
                productId
                quantity
              }
            }
          }
        }
        billDetails {
          subSavings
          subSavingsAmount
          subTotal
          subTotalAmount
          total
          totalAmount
          deliveryFee
          deliveryFeeAmount
          gst
          gstAmount
          membershipCharged
          membershipChargedAmount
          cashbackUsed
          cashbackUsedAmount
          payable
          payableAmount
          coupon {
            name
            label
            amount
          }
          productDiscount {
            label
            amount
          }
          offerDiscount {
            label
            amount
          }
        }
      }
    }
  }
`;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const ADD_TO_BASKET_MUTATION = `
  mutation addToBasket($payload: AddToBasketFilterInput!) {
    addToBasket(payload: $payload) {
      appliedOffers {
        id
        benefitType
        cashbackAmount
        offerType
        productName
        isNewUserOffer
      }
      removedOffers {
        id
        benefitType
        cashbackAmount
        offerType
        productName
        isNewUserOffer
      }
      isMembershipApplied
      isRefreshBasket
      isCouponRemoved
      flashDealsRemoved
      error {
        error
        errorMsg
        nextOrderDate
        parentProductId
        additionalCharges {
          type
          amount
          days
        }
      }
      basket {
        id
        date
        quantity
        isOtdf
        saving
        total
        products {
          id
          name
          weight {
            text
            value
            unit
          }
          price {
            currency
            mrp {
              amount
              value
            }
            price {
              amount
              value
            }
            discount {
              percent
              displayValue
            }
          }
          order {
            productId
            quantity
          }
          assets {
            image {
              url
            }
          }
        }
        billDetails {
          subSavings
          subTotal
          total
          subSavingsAmount
          subTotalAmount
          totalAmount
        }
      }
    }
  }
`;

export const REMOVE_FROM_BASKET_MUTATION = `
  mutation removeFromBasket($payload: AddToBasketFilterInput!) {
    removeFromBasket(payload: $payload) {
      appliedOffers {
        id
        benefitType
        cashbackAmount
        offerType
        productName
        isNewUserOffer
      }
      removedOffers {
        id
        benefitType
        cashbackAmount
        offerType
        productName
        isNewUserOffer
      }
      isMembershipApplied
      isRefreshBasket
      isCouponRemoved
      flashDealsRemoved
      error {
        error
        errorMsg
        nextOrderDate
        parentProductId
        additionalCharges {
          type
          amount
          days
        }
      }
      basket {
        id
        date
        quantity
        isOtdf
        saving
        total
        products {
          id
          name
          weight {
            text
            value
            unit
          }
          price {
            currency
            mrp {
              amount
              value
            }
            price {
              amount
              value
            }
            discount {
              percent
              displayValue
            }
          }
          order {
            productId
            quantity
          }
          assets {
            image {
              url
            }
          }
        }
        billDetails {
          subSavings
          subTotal
          total
          subSavingsAmount
          subTotalAmount
          totalAmount
        }
      }
    }
  }
`;

export const GET_SEARCH_PRODUCTS_QUERY = `
  query getSearchProducts($searchPayload: SearchProductListFilterInput!, $cityId: Float!, $page: PaginationInput!) {
    getSearchProducts(searchPayload: $searchPayload, cityId: $cityId, page: $page) {
      products {
        ...ProductDossierFragment
      }
      config {
        layout
        design {
          rows
          showAvailability
          showDiscount
          showDealDiscount
          showSubscribe
          showCounter
        }
      }
      pages {
        limit
        page
        hasNextPage
        records
        pages
      }
      usePrevResults
      searchSuggestionKeyword
      attributionToken
      correlationId
    }
  }
  ${PRODUCT_DOSSIER_FRAGMENT}
`;
