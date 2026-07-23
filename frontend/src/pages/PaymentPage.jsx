import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  createAddress,
  createOrder,
  deleteCartItem,
  getUserAddresses,
} from "../services/api";
import { useAuth } from "../store/AuthContext";

import "../assets/styles/pages/payment/PaymentPage.css";

const EMPTY_ADDRESS = {
  receiverName: "",
  callNumber: "",
  zipCode: "",
  userAddress: "",
  addressDetail: "",
  deliveryRequest: "",
};

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "신용/체크카드",
    serverValue: "신용카드",
  },
  {
    id: "kakao",
    label: "카카오페이",
    serverValue: "카카오페이",
  },
  {
    id: "toss",
    label: "토스페이",
    serverValue: "토스페이",
  },
  {
    id: "bank",
    label: "무통장입금",
    serverValue: "무통장입금",
  },
];

const normalizeCheckoutItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      source:
        item.source === "cart" ? "cart" : "direct",
      cartItemId:
        item.cartItemId ?? item.cart_item_id ?? null,
      productId:
        item.productId ?? item.product_id ?? null,
      name:
        item.name ??
        item.product_name ??
        "상품명 없음",
      image:
        item.image ??
        item.image_url ??
        "/images/product-placeholder.png",
      price: Number(item.price ?? 0),
      quantity: Math.max(
        1,
        Number(item.quantity ?? 1)
      ),
      inventory: Number(item.inventory ?? 0),
      selectedSize:
        item.selectedSize ??
        item.selected_size ??
        "FREE",
      selectedColor:
        item.selectedColor ??
        item.selected_color ??
        "기본",
    }))
    .filter(
      (item) =>
        item.productId &&
        item.quantity > 0 &&
        item.price >= 0
    );
};

const addressToForm = (address) => ({
  receiverName: address?.receiver_name ?? "",
  callNumber: address?.call_number ?? "",
  zipCode: address?.zip_code ?? "",
  userAddress: address?.user_address ?? "",
  addressDetail: address?.address_detail ?? "",
  deliveryRequest:
    address?.delivery_request ?? "",
});

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  /*
   * 결제 상품은 PaymentPage가 장바구니 API를 다시 조회하지 않고
   * 상세페이지 또는 장바구니 페이지에서 전달받습니다.
   */
  const checkoutData = location.state;
  const checkoutId = checkoutData?.checkoutId;
  const checkoutType =
    checkoutData?.checkoutType === "cart"
      ? "cart"
      : "direct";
  const returnPath =
    checkoutData?.returnPath ||
    (checkoutType === "cart"
      ? "/moodfit/cart"
      : "/moodfit");

  const [orderItems, setOrderItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState("");
  const [useNewAddress, setUseNewAddress] =
    useState(false);
  const [addressForm, setAddressForm] =
    useState(EMPTY_ADDRESS);
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] =
    useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState("card");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] =
    useState(null);

  /*
   * 새로운 결제 진입마다 checkoutId/location.key가 바뀝니다.
   * 따라서 이전에 결제하지 않은 상품 상태는 남지 않고
   * 새로 전달받은 상품만 orderItems에 저장됩니다.
   */
  useEffect(() => {
    if (!user?.id) {
      navigate("/moodfit/login", {
        replace: true,
        state: {
          from: location.pathname,
        },
      });
      return;
    }

    const receivedItems = normalizeCheckoutItems(
      checkoutData?.checkoutItems
    );

    if (!checkoutId || receivedItems.length === 0) {
      alert(
        "결제할 상품 정보가 없습니다. 이전 페이지로 이동합니다."
      );
      navigate(returnPath, { replace: true });
      return;
    }

    const loadCheckout = async () => {
      try {
        setLoading(true);
        setError("");
        setCompletedOrder(null);
        setPaymentMethod("card");

        // 이전 결제 시도의 상품을 완전히 덮어씁니다.
        setOrderItems(receivedItems);

        const addressResponse =
          await getUserAddresses(user.id);

        const addressList = Array.isArray(
          addressResponse
        )
          ? addressResponse
          : [];

        setAddresses(addressList);

        if (addressList.length > 0) {
          const defaultAddress =
            addressList.find(
              (address) =>
                Number(address.is_default) === 1
            ) ?? addressList[0];

          setSelectedAddressId(
            String(defaultAddress.id)
          );
          setAddressForm(
            addressToForm(defaultAddress)
          );
          setUseNewAddress(false);
          setSaveAsDefaultAddress(false);
        } else {
          setSelectedAddressId("");
          setAddressForm(EMPTY_ADDRESS);
          setUseNewAddress(true);
          setSaveAsDefaultAddress(true);
        }
      } catch (requestError) {
        console.error(
          "주문 페이지 조회 실패:",
          requestError
        );

        setError(
          requestError.response?.data?.detail ||
            "주문 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [
    checkoutId,
    location.key,
    navigate,
    returnPath,
    user?.id,
  ]);

  const productTotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      ),
    [orderItems]
  );

  const deliveryFee =
    productTotal === 0 || productTotal >= 50000
      ? 0
      : 3000;

  /*
   * 현재 주문 백엔드는 상품 총액만 저장하므로
   * createOrder에는 상품 정보만 전달합니다.
   * 화면에서는 배송비를 포함한 예상 결제금액을 보여줍니다.
   */
  const finalPrice =
    productTotal + deliveryFee;

  const selectedPayment =
    PAYMENT_METHODS.find(
      (method) => method.id === paymentMethod
    );

  const changeQuantity = (
    targetItem,
    nextQuantity
  ) => {
    if (nextQuantity < 1) return;

    if (
      targetItem.inventory > 0 &&
      nextQuantity > targetItem.inventory
    ) {
      alert(
        `최대 ${targetItem.inventory}개까지 구매할 수 있습니다.`
      );
      return;
    }

    setOrderItems((previousItems) =>
      previousItems.map((item) =>
        item.productId === targetItem.productId &&
        item.cartItemId === targetItem.cartItemId &&
        item.selectedSize ===
          targetItem.selectedSize &&
        item.selectedColor ===
          targetItem.selectedColor
          ? {
              ...item,
              quantity: nextQuantity,
            }
          : item
      )
    );
  };

  const removeCheckoutItem = (targetItem) => {
    const shouldRemove = window.confirm(
      `${targetItem.name} 상품을 구매 목록에서 제외할까요?`
    );

    if (!shouldRemove) return;

    const remainingItems = orderItems.filter(
      (item) =>
        !(
          item.productId ===
            targetItem.productId &&
          item.cartItemId ===
            targetItem.cartItemId &&
          item.selectedSize ===
            targetItem.selectedSize &&
          item.selectedColor ===
            targetItem.selectedColor
        )
    );

    if (remainingItems.length === 0) {
      /*
       * 마지막 상품이 제거되면 진입한 페이지로 돌아갑니다.
       * 장바구니에서 왔으면 장바구니,
       * 상세페이지에서 왔으면 해당 상세페이지입니다.
       */
      navigate(returnPath, { replace: true });
      return;
    }

    setOrderItems(remainingItems);
  };

  const handleAddressSelect = (event) => {
    const value = event.target.value;

    setSelectedAddressId(value);
    setUseNewAddress(value === "new");

    if (value === "new") {
      setAddressForm(EMPTY_ADDRESS);

      // 저장된 배송지가 하나도 없다면 첫 배송지는 자동으로 기본 배송지가 됩니다.
      setSaveAsDefaultAddress(addresses.length === 0);
      return;
    }

    setSaveAsDefaultAddress(false);

    const selected = addresses.find(
      (address) =>
        String(address.id) === value
    );

    setAddressForm(addressToForm(selected));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateOrder = () => {
    if (orderItems.length === 0) {
      return "주문할 상품이 없습니다.";
    }

    const invalidItem = orderItems.some(
      (item) =>
        !item.productId ||
        item.quantity < 1 ||
        !item.selectedSize
    );

    if (invalidItem) {
      return "주문 상품 정보가 올바르지 않습니다.";
    }

    if (useNewAddress || !selectedAddressId) {
      if (!addressForm.receiverName.trim()) {
        return "받는 사람을 입력해주세요.";
      }

      if (!addressForm.callNumber.trim()) {
        return "연락처를 입력해주세요.";
      }

      if (!addressForm.zipCode.trim()) {
        return "우편번호를 입력해주세요.";
      }

      if (!addressForm.userAddress.trim()) {
        return "주소를 입력해주세요.";
      }

      if (!addressForm.addressDetail.trim()) {
        return "상세 주소를 입력해주세요.";
      }
    }

    if (!selectedPayment) {
      return "결제 수단을 선택해주세요.";
    }

    return "";
  };

  const handlePayment = async () => {
    const validationMessage = validateOrder();

    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const confirmed = window.confirm(
      `${finalPrice.toLocaleString()}원을 결제하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError("");

      let orderAddressId =
        !useNewAddress && selectedAddressId
          ? selectedAddressId
          : null;

      /*
       * 새 배송지를 기본 배송지로 등록하기로 한 경우,
       * 이미 존재하는 배송지 API를 이용해 먼저 저장합니다.
       *
       * 백엔드는 is_default=true가 전달되면 기존 기본 배송지를
       * 자동으로 해제하고 새 배송지를 기본 배송지로 지정합니다.
       */
      if (useNewAddress && saveAsDefaultAddress) {
        const savedAddress = await createAddress({
          userId: user.id,
          ...addressForm,
          isDefault: true,
        });

        orderAddressId = savedAddress.id;
      }

      const result = await createOrder({
        userId: user.id,
        addressId: orderAddressId,
        addressInfo: orderAddressId
          ? null
          : addressForm,
        selectedOrder:
          selectedPayment.serverValue,
        items: orderItems,
      });

      /*
       * 장바구니에서 넘어온 결제 상품 중
       * 실제로 최종 구매한 항목만 장바구니 DB에서 삭제합니다.
       *
       * 결제페이지에서 구매 목록에서 제외한 상품은
       * 실제 장바구니에 그대로 남습니다.
       */
      if (checkoutType === "cart") {
        await Promise.allSettled(
          orderItems
            .filter(
              (item) =>
                item.source === "cart" &&
                item.cartItemId
            )
            .map((item) =>
              deleteCartItem(
                item.cartItemId,
                user.id
              )
            )
        );

        window.dispatchEvent(
          new CustomEvent("cart-updated")
        );
      }

      setCompletedOrder(result);
    } catch (requestError) {
      console.error(
        "주문 생성 실패:",
        requestError
      );

      const detail =
        requestError.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "주문 처리 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="payment-page">
        <div className="payment-status">
          주문 정보를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (completedOrder) {
    return (
      <main className="payment-page">
        <section className="payment-complete">
          <CheckCircle2 size={58} />
          <h1>주문이 완료되었습니다.</h1>

          <p>
            주문번호{" "}
            <strong>
              {completedOrder.order_number}
            </strong>
          </p>

          <p>
            결제금액{" "}
            <strong>
              {Number(
                completedOrder.total_price ??
                  productTotal
              ).toLocaleString()}
              원
            </strong>
          </p>

          <div className="payment-complete-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/moodfit/mypage", {
                  replace: true,
                })
              }
            >
              구매내역 보기
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                navigate("/moodfit", {
                  replace: true,
                })
              }
            >
              쇼핑 계속하기
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <section className="payment-container">
        <h1>주문 / 결제</h1>

        {error && (
          <div
            className="payment-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="payment-layout">
          <div className="payment-left">
            <section className="payment-box">
              <h2>
                <ShoppingBag size={22} />
                주문 상품
              </h2>

              <div className="payment-items">
                {orderItems.map((item) => (
                  <article
                    className="payment-item"
                    key={[
                      item.source,
                      item.cartItemId ??
                        item.productId,
                      item.selectedSize,
                      item.selectedColor,
                    ].join("-")}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.src =
                          "/images/product-placeholder.png";
                      }}
                    />

                    <div className="payment-item-info">
                      <h3>{item.name}</h3>

                      <p>
                        색상: {item.selectedColor}
                        {" / "}
                        사이즈: {item.selectedSize}
                      </p>

                      <strong>
                        {item.price.toLocaleString()}
                        원
                      </strong>
                    </div>

                    <div className="payment-quantity-box">
                      <button
                        type="button"
                        aria-label="수량 줄이기"
                        disabled={
                          item.quantity <= 1
                        }
                        onClick={() =>
                          changeQuantity(
                            item,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus size={16} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label="수량 늘리기"
                        disabled={
                          item.inventory > 0 &&
                          item.quantity >=
                            item.inventory
                        }
                        onClick={() =>
                          changeQuantity(
                            item,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="payment-item-total">
                      {(
                        item.price * item.quantity
                      ).toLocaleString()}
                      원
                    </div>

                    <button
                      type="button"
                      className="payment-delete-button"
                      aria-label={`${item.name} 구매 목록에서 제외`}
                      onClick={() =>
                        removeCheckoutItem(item)
                      }
                    >
                      <Trash2 size={20} />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="payment-box">
              <h2>
                <MapPin size={22} />
                배송지 정보
              </h2>

              {addresses.length > 0 && (
                <label className="payment-address-select">
                  <span>배송지 선택</span>

                  <select
                    value={
                      useNewAddress
                        ? "new"
                        : selectedAddressId
                    }
                    onChange={
                      handleAddressSelect
                    }
                  >
                    {addresses.map(
                      (address) => (
                        <option
                          key={address.id}
                          value={address.id}
                        >
                          {
                            address.receiver_name
                          }
                          {" · "}
                          {address.user_address}
                          {Number(
                            address.is_default
                          ) === 1
                            ? " (기본)"
                            : ""}
                        </option>
                      )
                    )}

                    <option value="new">
                      새 배송지 입력
                    </option>
                  </select>
                </label>
              )}

              <div className="payment-form">
                <input
                  name="receiverName"
                  value={
                    addressForm.receiverName
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="받는 사람"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />

                <input
                  name="callNumber"
                  value={addressForm.callNumber}
                  onChange={
                    handleAddressChange
                  }
                  placeholder="연락처"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />

                <input
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={
                    handleAddressChange
                  }
                  placeholder="우편번호"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />

                <input
                  className="payment-form-wide"
                  name="userAddress"
                  value={
                    addressForm.userAddress
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="주소"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />

                <input
                  className="payment-form-wide"
                  name="addressDetail"
                  value={
                    addressForm.addressDetail
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="상세 주소"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />

                <textarea
                  className="payment-form-wide"
                  name="deliveryRequest"
                  value={
                    addressForm.deliveryRequest
                  }
                  onChange={
                    handleAddressChange
                  }
                  placeholder="배송 요청사항"
                  disabled={
                    !useNewAddress &&
                    Boolean(selectedAddressId)
                  }
                />
              </div>

              {useNewAddress && (
                <label className="payment-default-address">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultAddress}
                    onChange={(event) =>
                      setSaveAsDefaultAddress(
                        event.target.checked
                      )
                    }
                    disabled={
                      addresses.length === 0
                    }
                  />

                  <span>
                    기본 배송지로 등록하기
                  </span>

                  {addresses.length === 0 && (
                    <small>
                      첫 배송지는 자동으로 기본 배송지로 등록됩니다.
                    </small>
                  )}
                </label>
              )}
            </section>

            <section className="payment-box">
              <h2>
                <CreditCard size={22} />
                결제 수단
              </h2>

              <div className="payment-methods">
                {PAYMENT_METHODS.map(
                  (method) => (
                    <button
                      type="button"
                      key={method.id}
                      className={
                        paymentMethod ===
                        method.id
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setPaymentMethod(
                          method.id
                        )
                      }
                    >
                      {method.label}
                    </button>
                  )
                )}
              </div>

              <p className="payment-method-notice">
                현재 프로젝트에서는 실제 PG
                결제가 아닌 주문 데이터 생성
                방식으로 처리됩니다.
              </p>
            </section>
          </div>

          <aside className="payment-summary">
            <h2>결제 금액</h2>

            <div className="summary-row">
              <span>상품 금액</span>
              <strong>
                {productTotal.toLocaleString()}
                원
              </strong>
            </div>

            <div className="summary-row">
              <span>배송비</span>
              <strong>
                {deliveryFee === 0
                  ? "무료"
                  : `${deliveryFee.toLocaleString()}원`}
              </strong>
            </div>

            <div className="summary-delivery">
              <Truck size={18} />
              50,000원 이상 구매 시 무료배송
            </div>

            <div className="summary-total">
              <span>총 결제금액</span>
              <strong>
                {finalPrice.toLocaleString()}원
              </strong>
            </div>

            <button
              type="button"
              className="payment-submit"
              disabled={submitting}
              onClick={handlePayment}
            >
              {submitting
                ? "주문 처리 중..."
                : `${finalPrice.toLocaleString()}원 결제하기`}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default PaymentPage;