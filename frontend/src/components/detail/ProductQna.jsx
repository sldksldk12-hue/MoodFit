import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createInquiry,
  getProductInquiries,
} from "../../services/api";

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || error.message || fallback;

/**
 * 상품 상세페이지의 문의 목록과 문의 등록 기능을 담당합니다.
 */
const ProductQna = ({ productId, userId }) => {
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  const loadInquiries = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError("");

      const data = await getProductInquiries(productId);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("상품 문의 조회 실패:", requestError);
      setError(
        getErrorMessage(
          requestError,
          "상품 문의를 불러오는 중 오류가 발생했습니다."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const openInquiryForm = () => {
    if (!userId) {
      navigate("/moodfit/login", {
        state: {
          from: `/moodfit/detail/${productId}`,
        },
      });
      return;
    }

    setIsFormOpen(true);
  };

  const closeInquiryForm = () => {
    if (submitting) return;

    setIsFormOpen(false);
    setForm({ title: "", content: "" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      alert("문의 제목을 입력해 주세요.");
      return;
    }

    if (!content) {
      alert("문의 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);

      await createInquiry({
        userId,
        productId,
        title,
        content,
      });

      setForm({ title: "", content: "" });
      setIsFormOpen(false);
      await loadInquiries();
      alert("상품 문의가 등록되었습니다.");
    } catch (requestError) {
      console.error("상품 문의 등록 실패:", requestError);
      alert(
        getErrorMessage(
          requestError,
          "상품 문의 등록 중 오류가 발생했습니다."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="detail-content active product-qna">
      <div className="qna-header">
        <div>
          <h3>상품 Q&amp;A</h3>
          <p>상품에 대해 궁금한 내용을 문의해 주세요.</p>
        </div>

        <button
          type="button"
          className="qna-write-button"
          onClick={openInquiryForm}
        >
          문의 작성
        </button>
      </div>

      {error && (
        <div className="qna-state qna-error">
          <p>{error}</p>
          <button type="button" onClick={loadInquiries}>
            다시 불러오기
          </button>
        </div>
      )}

      {!error && loading && (
        <div className="qna-state">문의 내역을 불러오는 중입니다.</div>
      )}

      {!error && !loading && inquiries.length === 0 && (
        <div className="qna-state">
          아직 등록된 문의가 없습니다. 첫 문의를 남겨보세요.
        </div>
      )}

      {!error && !loading && inquiries.length > 0 && (
        <div className="qna-list">
          {inquiries.map((inquiry) => (
            <article className="qna-item" key={inquiry.id}>
              <div className="qna-item-head">
                <div>
                  <span className="qna-label">Q</span>
                  <strong>{inquiry.title}</strong>
                </div>

                <span
                  className={`qna-status ${
                    inquiry.inq_status === "답변완료"
                      ? "answered"
                      : "waiting"
                  }`}
                >
                  {inquiry.inq_status}
                </span>
              </div>

              <p className="qna-question-content">{inquiry.content}</p>

              <div className="qna-meta">
                <span>작성자 회원 #{inquiry.user_id}</span>
                <span>{formatDate(inquiry.created_at)}</span>
              </div>

              {inquiry.reply_content && (
                <div className="qna-answer">
                  <span className="qna-label answer">A</span>
                  <div>
                    <strong>MOODFIT 관리자 답변</strong>
                    <p>{inquiry.reply_content}</p>
                    <time>{formatDate(inquiry.replied_at)}</time>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div
          className="qna-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInquiryForm();
            }
          }}
        >
          <form className="qna-modal" onSubmit={handleSubmit}>
            <div className="qna-modal-head">
              <div>
                <span>PRODUCT INQUIRY</span>
                <h3>상품 문의 작성</h3>
              </div>

              <button
                type="button"
                className="qna-close-button"
                onClick={closeInquiryForm}
                aria-label="문의 작성 창 닫기"
              >
                ×
              </button>
            </div>

            <label>
              문의 제목
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={255}
                placeholder="문의 제목을 입력해 주세요."
                disabled={submitting}
              />
            </label>

            <label>
              문의 내용
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={7}
                placeholder="상품에 대해 궁금한 내용을 자세히 입력해 주세요."
                disabled={submitting}
              />
            </label>

            <div className="qna-modal-actions">
              <button
                type="button"
                className="qna-cancel-button"
                onClick={closeInquiryForm}
                disabled={submitting}
              >
                취소
              </button>

              <button
                type="submit"
                className="qna-submit-button"
                disabled={submitting}
              >
                {submitting ? "등록 중..." : "문의 등록"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default ProductQna;
