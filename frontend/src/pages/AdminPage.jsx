import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  ExternalLink,
  LoaderCircle,
  MessageSquare,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  analyzeAdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  getAdminCategories,
  getAdminDashboard,
  getAdminInquiries,
  getAdminOrders,
  getAdminProducts,
  getAdminReviews,
  getAdminUsers,
  replyAdminInquiry,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminUserRole,
} from "../services/adminApi";
import { useAuth } from "../store/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import "../assets/styles/pages/admin/AdminPage.css";

const MENUS = [
  { id: "dashboard", label: "대시보드", icon: BarChart3 },
  { id: "products", label: "상품 관리", icon: Boxes },
  { id: "orders", label: "주문 관리", icon: ShoppingBag },
  { id: "inquiries", label: "문의 관리", icon: MessageSquare },
  { id: "users", label: "회원 관리", icon: Users },
  { id: "reviews", label: "리뷰 관리", icon: Star },
];

const ORDER_STATUSES = ["결제완료", "상품준비중", "배송중", "배송완료", "주문취소", "환불완료"];

const dateText = (value) => value ? new Date(value).toLocaleString("ko-KR") : "-";
const getErrorMessage = (error) => error.response?.data?.detail || "요청 처리 중 오류가 발생했습니다.";

const createEmptyProduct = () => ({
  product_name: "",
  brand: "",
  category_id: "",
  original_price: 0,
  discount_price: 0,
  inventory: 0,
  gender_target: "공용",
  image_urls_text: "",
  purchase_link: "",
  product_content: "",
  tags: {
    mood_tag: "#편안함",
    weather_tag: "#맑음",
    season_tag: "#사계절",
    tour_tag: "#카페/도심",
  },
  ai_used: false,
});

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [createProduct, setCreateProduct] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [replyInquiry, setReplyInquiry] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.admin_role === "ADMIN";

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      let response;
      if (activeMenu === "dashboard") response = await getAdminDashboard();
      if (activeMenu === "products") response = await getAdminProducts({ q: keyword });
      if (activeMenu === "orders") response = await getAdminOrders({ q: keyword, order_status: statusFilter });
      if (activeMenu === "inquiries") response = await getAdminInquiries({ q: keyword, inq_status: statusFilter });
      if (activeMenu === "users") response = await getAdminUsers({ q: keyword });
      if (activeMenu === "reviews") response = await getAdminReviews({ q: keyword });
      setData(response);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [activeMenu, isAdmin, keyword, statusFilter]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/moodfit/login", { replace: true });
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(loadData, 200);
    return () => window.clearTimeout(timer);
  }, [isAdmin, loadData]);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, [isAdmin]);

  const changeMenu = (menu) => {
    setActiveMenu(menu);
    setKeyword("");
    setStatusFilter("");
    setData(null);
  };

  const items = useMemo(() => Array.isArray(data) ? data : data?.items || [], [data]);

  const openProductEdit = (product) => {
    const imageUrls = Array.isArray(product.image_urls)
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

    setEditProduct({
      ...product,
      image_urls_text: imageUrls.join("\n"),
    });
  };

  const handleProductSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const imageUrls = String(editProduct.image_urls_text || "")
        .split(/[\n,]+/)
        .map((url) => url.trim())
        .filter(Boolean);

      if (!imageUrls.length) {
        alert("상품 이미지 URL을 1개 이상 입력하세요.");
        setSaving(false);
        return;
      }

      await updateAdminProduct(editProduct.id, {
        product_name: editProduct.product_name,
        category_id: editProduct.category_id ? Number(editProduct.category_id) : null,
        original_price: Number(editProduct.original_price),
        discount_price: Number(editProduct.discount_price),
        inventory: Number(editProduct.inventory),
        brand: editProduct.brand,
        gender_target: editProduct.gender_target,
        image_urls: imageUrls,
        product_content: editProduct.product_content || null,
      });
      setEditProduct(null);
      await loadData();
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };


  const handleProductAnalyze = async () => {
    if (!createProduct?.product_name.trim()) {
      alert("AI 분석 전에 상품명을 입력하세요.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeAdminProduct({
        product_name: createProduct.product_name,
        brand: createProduct.brand,
        product_content: createProduct.product_content || null,
      });
      setCreateProduct((current) => ({
        ...current,
        category_id: String(result.category_id),
        tags: result.tags,
        ai_used: result.ai_used,
      }));
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProductCreate = async (event) => {
    event.preventDefault();
    const imageUrls = createProduct.image_urls_text
      .split(/[,\n]/)
      .map((url) => url.trim())
      .filter(Boolean);
    if (!createProduct.category_id) {
      alert("카테고리를 선택하거나 AI 추천을 실행하세요.");
      return;
    }
    setSaving(true);
    try {
      await createAdminProduct({
        product_name: createProduct.product_name,
        brand: createProduct.brand,
        category_id: Number(createProduct.category_id),
        original_price: Number(createProduct.original_price),
        discount_price: Number(createProduct.discount_price),
        inventory: Number(createProduct.inventory),
        gender_target: createProduct.gender_target,
        image_urls: imageUrls,
        purchase_link: createProduct.purchase_link || null,
        product_content: createProduct.product_content || null,
        tags: createProduct.tags,
      });
      setCreateProduct(null);
      await loadData();
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleProductDelete = async (product) => {
    if (!window.confirm(`“${product.product_name}” 상품을 삭제할까요?`)) return;
    try {
      await deleteAdminProduct(product.id);
      await loadData();
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    }
  };

  const handleOrderStatus = async (orderId, nextStatus) => {
    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      setData((previous) => ({ ...previous, items: previous.items.map((item) => item.id === orderId ? { ...item, order_status: nextStatus } : item) }));
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    }
  };

  // 문의에 연결된 상품 상세페이지를 새 탭으로 엽니다.
  // 관리자 페이지의 현재 메뉴, 검색어, 필터 상태를 그대로 유지할 수 있습니다.
  const handleViewInquiryProduct = (inquiry) => {
    if (!inquiry?.product_id) {
      alert("연결된 상품 정보를 찾을 수 없습니다.");
      return;
    }

    window.open(
      `/moodfit/detail/${inquiry.product_id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleReply = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await replyAdminInquiry(replyInquiry.id, replyInquiry.reply_content);
      setReplyInquiry(null);
      await loadData();
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleRole = async (member, role) => {
    if (!window.confirm(`${member.user_account} 회원의 권한을 ${role}로 변경할까요?`)) return;
    try {
      await updateAdminUserRole(member.id, role);
      setData((previous) => previous.map((item) => item.id === member.id ? { ...item, admin_role: role } : item));
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    }
  };

  const handleReviewDelete = async (review) => {
    if (!window.confirm("이 리뷰를 관리자 권한으로 삭제할까요?")) return;
    try {
      await deleteAdminReview(review.id);
      setData((previous) => previous.filter((item) => item.id !== review.id));
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    }
  };

  if (authLoading || !user) return <main className="admin-state"><LoaderCircle className="spin" /> 로그인 정보를 확인하는 중입니다.</main>;
  if (!isAdmin) return (
    <main className="admin-state admin-denied">
      <ShieldCheck size={52} />
      <h1>관리자 권한이 필요합니다.</h1>
      <p>일반 회원은 관리자 페이지에 접근할 수 없습니다.</p>
      <button onClick={() => navigate("/moodfit")}>메인으로 돌아가기</button>
    </main>
  );

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>MOODFIT</span><strong>Admin Console</strong></div>
        <nav>
          {MENUS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeMenu === id ? "active" : ""} onClick={() => changeMenu(id)}>
              <Icon size={19} /><span>{label}</span><ChevronRight size={16} />
            </button>
          ))}
        </nav>
        <div className="admin-profile"><ShieldCheck size={20} /><div><strong>{user.user_account}</strong><span>최고 관리자</span></div></div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div><span>ADMINISTRATION</span><h1>{MENUS.find((menu) => menu.id === activeMenu)?.label}</h1></div>
          <div className="admin-topbar-actions">{activeMenu === "products" && <button className="admin-create-btn" onClick={() => setCreateProduct(createEmptyProduct())}><Plus size={17} /> 상품 등록</button>}<button className="admin-refresh" onClick={loadData}><RefreshCw size={17} /> 새로고침</button></div>
        </header>

        {activeMenu !== "dashboard" && (
          <div className="admin-toolbar">
            <label className="admin-search"><Search size={18} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="검색어를 입력하세요" /></label>
            {activeMenu === "orders" && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">전체 주문 상태</option>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}
            {activeMenu === "inquiries" && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">전체 답변 상태</option><option>답변대기</option><option>답변완료</option></select>}
          </div>
        )}

        {error && <div className="admin-alert"><AlertTriangle size={19} />{error}</div>}
        {loading ? <div className="admin-loading"><LoaderCircle className="spin" /> 데이터를 불러오는 중입니다.</div> : (
          <>
            {activeMenu === "dashboard" && <Dashboard data={data} />}
            {activeMenu === "products" && <ProductTable items={items} onEdit={openProductEdit} onDelete={handleProductDelete} />}
            {activeMenu === "orders" && <OrderTable items={items} onStatus={handleOrderStatus} />}
            {activeMenu === "inquiries" && <InquiryTable items={items} onReply={(item) => setReplyInquiry({ ...item, reply_content: item.reply_content || "" })} onViewProduct={handleViewInquiryProduct} />}
            {activeMenu === "users" && <UserTable items={items} currentUserId={user.id} onRole={handleRole} />}
            {activeMenu === "reviews" && <ReviewTable items={items} onDelete={handleReviewDelete} />}
          </>
        )}
      </section>

      {createProduct && <ProductCreateModal product={createProduct} categories={categories} saving={saving} analyzing={analyzing} onChange={setCreateProduct} onAnalyze={handleProductAnalyze} onClose={() => setCreateProduct(null)} onSubmit={handleProductCreate} />}
      {editProduct && <ProductModal product={editProduct} categories={categories} saving={saving} onChange={setEditProduct} onClose={() => setEditProduct(null)} onSubmit={handleProductSave} />}
      {replyInquiry && <ReplyModal inquiry={replyInquiry} saving={saving} onChange={setReplyInquiry} onClose={() => setReplyInquiry(null)} onSubmit={handleReply} onViewProduct={handleViewInquiryProduct} />}
    </main>
  );
};

const Dashboard = ({ data }) => {
  const kpi = data?.kpi || {};
  const cards = [
    ["누적 매출", formatPrice(kpi.total_sales || 0), ShoppingBag],
    ["오늘 주문", `${kpi.today_orders || 0}건`, ClipboardList],
    ["전체 회원", `${kpi.user_count || 0}명`, Users],
    ["답변 대기", `${kpi.waiting_inquiries || 0}건`, MessageSquare],
    ["재고 부족", `${kpi.low_stock || 0}개`, AlertTriangle],
    ["전체 리뷰", `${kpi.review_count || 0}개`, Star],
  ];
  const maxSales = Math.max(...(data?.daily_sales || []).map((item) => item.sales), 1);
  return <>
    <section className="admin-kpi-grid">{cards.map(([label, value, Icon]) => <article key={label} className="admin-kpi-card"><span className="admin-kpi-icon"><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong></div></article>)}</section>
    <div className="admin-dashboard-grid">
      <section className="admin-panel"><div className="admin-panel-title"><div><span>최근 7일</span><h2>일별 매출</h2></div><BarChart3 size={21} /></div><div className="sales-chart">{(data?.daily_sales || []).map((item) => <div className="sales-column" key={item.date}><div className="sales-value">{item.sales ? `${Math.round(item.sales / 10000)}만` : "0"}</div><div className="sales-bar-wrap"><div className="sales-bar" style={{ height: `${Math.max(4, (item.sales / maxSales) * 100)}%` }} /></div><span>{item.date.slice(5)}</span></div>)}</div></section>
      <section className="admin-panel"><div className="admin-panel-title"><div><span>실시간 현황</span><h2>최근 주문</h2></div><PackageSearch size={21} /></div><div className="recent-order-list">{(data?.recent_orders || []).map((order) => <article key={order.id}><div><strong>{order.order_number}</strong><span>{order.user_account} · {dateText(order.created_at)}</span></div><div><strong>{formatPrice(order.total_price)}</strong><span className={`status-pill status-${order.order_status}`}>{order.order_status}</span></div></article>)}</div></section>
    </div>
  </>;
};

const Empty = () => <div className="admin-empty"><PackageSearch size={42} /><strong>표시할 데이터가 없습니다.</strong></div>;

const ProductTable = ({ items, onEdit, onDelete }) => items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>상품</th><th>브랜드/카테고리</th><th>판매가</th><th>재고</th><th>좋아요</th><th>관리</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="product-cell">{item.image_url ? <img src={item.image_url} alt="" /> : <div className="image-placeholder" />}<div><strong>{item.product_name}</strong><span>#{item.id}</span></div></div></td><td><strong>{item.brand}</strong><span className="cell-sub">{item.category_name || "미분류"}</span></td><td>{formatPrice(item.discount_price)}</td><td><span className={item.inventory <= 5 ? "stock-danger" : ""}>{item.inventory}개</span></td><td>{item.like_count}</td><td><div className="table-actions"><button onClick={() => onEdit(item)}><Edit3 size={15} />수정</button><button className="danger" onClick={() => onDelete(item)}><Trash2 size={15} />삭제</button></div></td></tr>)}</tbody></table></div> : <Empty />;

const OrderTable = ({ items, onStatus }) => items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>주문번호</th><th>회원</th><th>상품 수량</th><th>결제금액</th><th>주문일시</th><th>상태 변경</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.order_number}</strong></td><td>{item.user_account}</td><td>{item.item_count}개</td><td>{formatPrice(item.total_price)}</td><td>{dateText(item.created_at)}</td><td><select className="status-select" value={item.order_status} onChange={(event) => onStatus(item.id, event.target.value)}>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <Empty />;

const InquiryTable = ({ items, onReply, onViewProduct }) => items.length ? <div className="admin-card-list">{items.map((item) => <article className="inquiry-card" key={item.id}><div className="inquiry-card-head"><div><span className={`status-pill status-${item.inq_status}`}>{item.inq_status}</span><h3>{item.title}</h3><p>{item.user_account} · {dateText(item.created_at)}</p></div><div className="inquiry-card-actions"><button type="button" onClick={() => onViewProduct(item)}><ExternalLink size={16} />상품 보기</button><button type="button" onClick={() => onReply(item)}><MessageSquare size={16} />{item.reply_content ? "답변 수정" : "답변 작성"}</button></div></div><div className="inquiry-content"><strong>문의 내용</strong><p>{item.content}</p>{item.reply_content && <div className="reply-preview"><CheckCircle2 size={17} /><div><strong>관리자 답변</strong><p>{item.reply_content}</p></div></div>}</div></article>)}</div> : <Empty />;

const UserTable = ({ items, currentUserId, onRole }) => items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>회원</th><th>이메일</th><th>가입일</th><th>주문</th><th>리뷰</th><th>권한</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.user_account}</strong>{item.id === currentUserId && <span className="me-badge">나</span>}</td><td>{item.email}</td><td>{dateText(item.created_at)}</td><td>{item.order_count}건</td><td>{item.review_count}개</td><td><select disabled={item.id === currentUserId} value={item.admin_role} onChange={(event) => onRole(item, event.target.value)}><option value="USER">일반 회원</option><option value="ADMIN">관리자</option></select></td></tr>)}</tbody></table></div> : <Empty />;

const ReviewTable = ({ items, onDelete }) => items.length ? <div className="admin-card-list">{items.map((item) => <article className="review-admin-card" key={item.id}><div className="review-admin-head"><div><strong>{item.product_name}</strong><span>{item.user_account} · {dateText(item.created_at)}</span></div><div className="review-stars">★ {item.rating.toFixed(1)}</div></div><p>{item.content}</p><button className="danger-text" onClick={() => onDelete(item)}><Trash2 size={15} />리뷰 삭제</button></article>)}</div> : <Empty />;

const ModalShell = ({ title, children, onClose }) => <div className="admin-modal-backdrop" onMouseDown={onClose}><section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button type="button" onClick={onClose}><X /></button></header>{children}</section></div>;


const ProductCreateModal = ({ product, categories, saving, analyzing, onChange, onAnalyze, onClose, onSubmit }) => {
  const setTag = (key, value) => onChange({ ...product, tags: { ...product.tags, [key]: value } });
  return <ModalShell title="새 상품 등록" onClose={onClose}><form className="admin-form product-create-form" onSubmit={onSubmit}>
    <div className="ai-analysis-box"><div><Sparkles size={20} /><div><strong>AI 카테고리·태그 추천</strong><p>상품명을 기준으로 service.py의 카테고리와 무드 태그를 추천합니다. 추천 후에도 직접 수정할 수 있습니다.</p></div></div><button type="button" onClick={onAnalyze} disabled={analyzing}>{analyzing ? "분석 중..." : "AI 분석"}</button></div>
    <label>상품명<input value={product.product_name} onChange={(e) => onChange({ ...product, product_name: e.target.value })} required placeholder="예: 코튼 케이블 크루넥 반팔 스웨터" /></label>
    <div className="form-row"><label>브랜드<input value={product.brand} onChange={(e) => onChange({ ...product, brand: e.target.value })} required /></label><label>대상 성별<select value={product.gender_target} onChange={(e) => onChange({ ...product, gender_target: e.target.value })}><option>공용</option><option>남성</option><option>여성</option></select></label></div>
    <label>카테고리<select value={product.category_id} onChange={(e) => onChange({ ...product, category_id: e.target.value })} required><option value="">카테고리를 선택하세요</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.parent_id ? "└ " : ""}{item.category_name}</option>)}</select><small>{product.ai_used ? "AI가 추천했습니다. 필요하면 다른 카테고리를 선택하세요." : "관리자가 직접 선택하거나 AI 분석으로 추천받을 수 있습니다."}</small></label>
    <div className="form-row three"><label>원가<input type="number" min="0" value={product.original_price} onChange={(e) => onChange({ ...product, original_price: e.target.value })} required /></label><label>판매가<input type="number" min="0" value={product.discount_price} onChange={(e) => onChange({ ...product, discount_price: e.target.value })} required /></label><label>재고<input type="number" min="0" value={product.inventory} onChange={(e) => onChange({ ...product, inventory: e.target.value })} required /></label></div>
    <label>상품 이미지 URL<textarea rows="3" value={product.image_urls_text} onChange={(e) => onChange({ ...product, image_urls_text: e.target.value })} required placeholder="여러 장은 줄바꿈 또는 쉼표로 구분하세요." /></label>
    <label>상세 설명<textarea rows="4" value={product.product_content} onChange={(e) => onChange({ ...product, product_content: e.target.value })} /></label>
    <fieldset className="tag-fieldset"><legend>추천 태그</legend><div className="form-row"><label>감정 태그<input value={product.tags.mood_tag} onChange={(e) => setTag("mood_tag", e.target.value)} required /></label><label>날씨 태그<input value={product.tags.weather_tag} onChange={(e) => setTag("weather_tag", e.target.value)} required /></label></div><div className="form-row"><label>계절 태그<input value={product.tags.season_tag} onChange={(e) => setTag("season_tag", e.target.value)} required /></label><label>TPO/관광 태그<input value={product.tags.tour_tag || ""} onChange={(e) => setTag("tour_tag", e.target.value)} /></label></div></fieldset>
    <footer><button type="button" className="secondary" onClick={onClose}>취소</button><button disabled={saving || analyzing}>{saving ? "등록 중..." : "상품 등록"}</button></footer>
  </form></ModalShell>;
};

const ProductModal = ({ product, categories, saving, onChange, onClose, onSubmit }) => {
  const previewImage = String(product.image_urls_text || "")
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .find(Boolean);

  return <ModalShell title="상품 정보 수정" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}>
    <label>상품명<input value={product.product_name} onChange={(e) => onChange({ ...product, product_name: e.target.value })} required /></label>
    <div className="form-row"><label>브랜드<input value={product.brand} onChange={(e) => onChange({ ...product, brand: e.target.value })} required /></label><label>카테고리<select value={product.category_id || ""} onChange={(e) => onChange({ ...product, category_id: e.target.value })}><option value="">미분류</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.category_name}</option>)}</select></label></div>
    <div className="form-row three"><label>원가<input type="number" min="0" value={product.original_price} onChange={(e) => onChange({ ...product, original_price: e.target.value })} /></label><label>판매가<input type="number" min="0" value={product.discount_price} onChange={(e) => onChange({ ...product, discount_price: e.target.value })} /></label><label>재고<input type="number" min="0" value={product.inventory} onChange={(e) => onChange({ ...product, inventory: e.target.value })} /></label></div>
    <label>상품 이미지 URL<textarea rows="4" value={product.image_urls_text || ""} onChange={(e) => onChange({ ...product, image_urls_text: e.target.value })} required placeholder="여러 장은 줄바꿈 또는 쉼표로 구분하세요." /><small>첫 번째 URL이 대표 이미지로 사용됩니다.</small></label>
    {previewImage && <div className="admin-product-image-preview"><span>대표 이미지 미리보기</span><img src={previewImage} alt="상품 대표 이미지 미리보기" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>}
    <label>상세 설명<textarea rows="5" value={product.product_content || ""} onChange={(e) => onChange({ ...product, product_content: e.target.value })} /></label>
    <footer><button type="button" className="secondary" onClick={onClose}>취소</button><button disabled={saving}>{saving ? "저장 중..." : "변경사항 저장"}</button></footer>
  </form></ModalShell>;
};

const ReplyModal = ({ inquiry, saving, onChange, onClose, onSubmit, onViewProduct }) => <ModalShell title="문의 답변" onClose={onClose}><form className="admin-form" onSubmit={onSubmit}><div className="modal-inquiry"><div className="modal-inquiry-head"><strong>{inquiry.title}</strong><button type="button" className="secondary inquiry-modal-product-btn" onClick={() => onViewProduct(inquiry)}><ExternalLink size={15} />상품 상세 보기</button></div><span>{inquiry.product_name || `상품 #${inquiry.product_id}`}</span><p>{inquiry.content}</p></div><label>관리자 답변<textarea autoFocus rows="8" value={inquiry.reply_content} onChange={(e) => onChange({ ...inquiry, reply_content: e.target.value })} required /></label><footer><button type="button" className="secondary" onClick={onClose}>취소</button><button disabled={saving}>{saving ? "등록 중..." : "답변 등록"}</button></footer></form></ModalShell>;

export default AdminPage;
