import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUserOrders } from "../services";
import { useAuth } from "../store/AuthContext";

import "../assets/styles/pages/payment/OrderHistoryPage.css";

const formatPrice = (value) =>
  `${Number(value ?? 0).toLocaleString()}원`;

const formatDate = (value) => {
  if (!value) return "날짜 정보 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusClass = (status = "") => {
  if (status.includes("취소") || status.includes("환불")) {
    return "cancelled";
  }

  if (status.includes("배송완료") || status.includes("구매확정")) {
    return "completed";
  }

  if (status.includes("배송")) {
    return "shipping";
  }

  return "paid";
};

const normalizeImage = (imageValue) => {
  if (Array.isArray(imageValue)) {
    return imageValue[0] || "/images/product-placeholder.png";
  }

  return imageValue || "/images/product-placeholder.png";
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      navigate("/moodfit/login", {
        replace: true,
        state: { from: "/moodfit/orders" },
      });
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUserOrders(user.id);
        const orderList = Array.isArray(response) ? response : [];

        if (cancelled) return;

        setOrders(orderList);

        // 최신 주문 한 건은 처음부터 상품 목록이 보이도록 펼칩니다.
        setExpandedOrderIds(
          orderList.length > 0 ? [orderList[0].order_id] : []
        );
      } catch (requestError) {
        console.error("주문 내역 조회 실패:", requestError);

        if (cancelled) return;

        setError(
          requestError.response?.data?.detail ||
            "주문 내역을 불러오지 못했습니다."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [navigate, user?.id]);

  const totalOrderPrice = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.total_price ?? 0),
        0
      ),
    [orders]
  );

  const totalItemCount = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          (Array.isArray(order.items)
            ? order.items.reduce(
                (itemSum, item) =>
                  itemSum + Number(item.quantity ?? 0),
                0
              )
            : 0),
        0
      ),
    [orders]
  );

  const toggleOrder = (orderId) => {
    setExpandedOrderIds((previous) =>
      previous.includes(orderId)
        ? previous.filter((id) => id !== orderId)
        : [...previous, orderId]
    );
  };

  if (loading) {
    return (
      <main className="order-history-page">
        <section className="order-history-status">
          <Package size={42} />
          <p>주문 내역을 불러오는 중입니다.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="order-history-page">
        <section className="order-history-status">
          <ReceiptText size={42} />
          <h1>주문 내역을 불러오지 못했습니다.</h1>
          <p className="order-history-error">{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            다시 불러오기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="order-history-page">
      <div className="order-history-container">
        <header className="order-history-header">
          <button
            type="button"
            className="order-history-back"
            aria-label="마이페이지로 돌아가기"
            onClick={() => navigate("/moodfit/mypage")}
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <p className="order-history-eyebrow">MY ORDERS</p>
            <h1>주문 내역</h1>
            <span>내가 주문한 상품과 배송 상태를 확인할 수 있습니다.</span>
          </div>
        </header>

        <section className="order-history-summary">
          <article>
            <span>전체 주문</span>
            <strong>{orders.length}</strong>
            <small>건</small>
          </article>

          <article>
            <span>구매 상품</span>
            <strong>{totalItemCount}</strong>
            <small>개</small>
          </article>

          <article>
            <span>누적 주문 금액</span>
            <strong>{totalOrderPrice.toLocaleString()}</strong>
            <small>원</small>
          </article>
        </section>

        {orders.length === 0 ? (
          <section className="order-history-empty">
            <ShoppingBag size={52} />
            <h2>아직 주문한 상품이 없습니다.</h2>
            <p>마음에 드는 상품을 찾아 첫 주문을 시작해보세요.</p>
            <button type="button" onClick={() => navigate("/moodfit/list")}>
              상품 보러 가기
            </button>
          </section>
        ) : (
          <section className="order-history-list">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const isExpanded = expandedOrderIds.includes(order.order_id);
              const representativeItem = items[0];
              const otherItemCount = Math.max(items.length - 1, 0);

              return (
                <article className="order-card" key={order.order_id}>
                  <div className="order-card-header">
                    <div>
                      <div className="order-date">
                        <CalendarDays size={16} />
                        {formatDate(order.created_at)}
                      </div>

                      <p>
                        주문번호 <strong>{order.order_number}</strong>
                      </p>
                    </div>

                    <span
                      className={`order-status ${getStatusClass(
                        order.order_status
                      )}`}
                    >
                      {order.order_status || "결제완료"}
                    </span>
                  </div>

                  {representativeItem && (
                    <button
                      type="button"
                      className="order-preview"
                      onClick={() =>
                        navigate(
                          `/moodfit/detail/${representativeItem.product_id}`
                        )
                      }
                    >
                      <img
                        src={normalizeImage(representativeItem.image_url)}
                        alt={representativeItem.product_name}
                        onError={(event) => {
                          event.currentTarget.src =
                            "/images/product-placeholder.png";
                        }}
                      />

                      <div className="order-preview-info">
                        <h2>{representativeItem.product_name}</h2>

                        <p>
                          {representativeItem.selected_color || "기본"}
                          {" / "}
                          {representativeItem.selected_size || "FREE"}
                        </p>

                        <span>
                          {formatPrice(representativeItem.price)}
                          {" · "}
                          {representativeItem.quantity}개
                        </span>

                        {otherItemCount > 0 && (
                          <small>외 {otherItemCount}개 상품</small>
                        )}
                      </div>

                      <strong>{formatPrice(order.total_price)}</strong>
                    </button>
                  )}

                  <div className="order-card-meta">
                    <div>
                      <CreditCard size={17} />
                      <span>결제수단</span>
                      <strong>{order.selected_order || "정보 없음"}</strong>
                    </div>

                    <div>
                      <ReceiptText size={17} />
                      <span>결제금액</span>
                      <strong>{formatPrice(order.total_price)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="order-expand-button"
                    onClick={() => toggleOrder(order.order_id)}
                  >
                    주문 상품 {items.length}개 보기
                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="order-item-list">
                      {items.map((item) => (
                        <article
                          className="order-item"
                          key={item.order_item_id}
                        >
                          <button
                            type="button"
                            className="order-item-product"
                            onClick={() =>
                              navigate(
                                `/moodfit/detail/${item.product_id}`
                              )
                            }
                          >
                            <img
                              src={normalizeImage(item.image_url)}
                              alt={item.product_name}
                              onError={(event) => {
                                event.currentTarget.src =
                                  "/images/product-placeholder.png";
                              }}
                            />

                            <div>
                              <h3>{item.product_name}</h3>
                              <p>
                                색상: {item.selected_color || "기본"}
                                {" · "}
                                사이즈: {item.selected_size || "FREE"}
                              </p>
                              <span>
                                {formatPrice(item.price)}
                                {" × "}
                                {item.quantity}개
                              </span>
                            </div>
                          </button>

                          <div className="order-item-actions">
                            <strong>
                              {formatPrice(
                                Number(item.price ?? 0) *
                                  Number(item.quantity ?? 0)
                              )}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/moodfit/detail/${item.product_id}`
                                )
                              }
                            >
                              상품 보기
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default OrderHistoryPage;
