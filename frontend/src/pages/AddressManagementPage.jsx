import {
  Check,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  updateAddress,
} from "../services/api";
import { useAuth } from "../store/AuthContext";

import "../assets/styles/pages/mypage/AddressManagementPage.css";

const EMPTY_FORM = {
  receiverName: "",
  callNumber: "",
  zipCode: "",
  userAddress: "",
  addressDetail: "",
  deliveryRequest: "",
  isDefault: false,
};

const addressToForm = (address) => ({
  receiverName: address?.receiver_name ?? "",
  callNumber: address?.call_number ?? "",
  zipCode: address?.zip_code ?? "",
  userAddress: address?.user_address ?? "",
  addressDetail: address?.address_detail ?? "",
  deliveryRequest: address?.delivery_request ?? "",
  isDefault: Number(address?.is_default) === 1,
});

const AddressManagementPage = () => {
  const { user } = useAuth();

  const [addressResult, setAddressResult] = useState({
    userId: null,
    addresses: [],
    error: "",
  });

  const [formMode, setFormMode] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [processingAddressId, setProcessingAddressId] = useState(null);

  const userId = user?.id ? Number(user.id) : null;

  const addresses =
    addressResult.userId === userId
      ? addressResult.addresses
      : [];

  const loading = Boolean(
    userId && addressResult.userId !== userId
  );

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        const defaultDifference =
          Number(b.is_default) - Number(a.is_default);

        if (defaultDifference !== 0) {
          return defaultDifference;
        }

        return Number(b.id) - Number(a.id);
      }),
    [addresses]
  );

  const loadAddresses = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await getUserAddresses(userId);

      setAddressResult({
        userId,
        addresses: Array.isArray(response) ? response : [],
        error: "",
      });
    } catch (error) {
      console.error("배송지 목록 조회 실패:", error);

      setAddressResult({
        userId,
        addresses: [],
        error:
          error.response?.data?.detail ||
          "배송지 목록을 불러오지 못했습니다.",
      });
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const requestAddresses = async () => {
      if (!userId) return;

      try {
        const response = await getUserAddresses(userId);

        if (cancelled) return;

        setAddressResult({
          userId,
          addresses: Array.isArray(response) ? response : [],
          error: "",
        });
      } catch (error) {
        if (cancelled) return;

        console.error("배송지 목록 조회 실패:", error);

        setAddressResult({
          userId,
          addresses: [],
          error:
            error.response?.data?.detail ||
            "배송지 목록을 불러오지 못했습니다.",
        });
      }
    };

    requestAddresses();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openCreateForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...EMPTY_FORM,
      isDefault: addresses.length === 0,
    });
    setFormMode("create");
  };

  const openEditForm = (address) => {
    setEditingAddressId(address.id);
    setAddressForm(addressToForm(address));
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;

    setFormMode(null);
    setEditingAddressId(null);
    setAddressForm(EMPTY_FORM);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
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

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        userId,
        ...addressForm,
      };

      if (formMode === "edit" && editingAddressId) {
        await updateAddress(editingAddressId, payload);
      } else {
        await createAddress(payload);
      }

      await loadAddresses();
      closeForm();
    } catch (error) {
      console.error("배송지 저장 실패:", error);

      alert(
        error.response?.data?.detail ||
          "배송지 저장 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address) => {
    if (Number(address.is_default) === 1) return;

    try {
      setProcessingAddressId(address.id);

      await updateAddress(address.id, {
        userId,
        ...addressToForm(address),
        isDefault: true,
      });

      await loadAddresses();
    } catch (error) {
      console.error("기본 배송지 설정 실패:", error);

      alert(
        error.response?.data?.detail ||
          "기본 배송지 설정 중 오류가 발생했습니다."
      );
    } finally {
      setProcessingAddressId(null);
    }
  };

  const handleDelete = async (address) => {
    const confirmed = window.confirm(
      `${address.receiver_name}님의 배송지를 삭제할까요?`
    );

    if (!confirmed) return;

    try {
      setProcessingAddressId(address.id);
      await deleteAddress(address.id);
      await loadAddresses();

      if (editingAddressId === address.id) {
        closeForm();
      }
    } catch (error) {
      console.error("배송지 삭제 실패:", error);

      alert(
        error.response?.data?.detail ||
          "배송지 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setProcessingAddressId(null);
    }
  };

  if (!userId) {
    return (
      <main className="address-management-page">
        <section className="address-empty-state">
          <MapPin size={38} />
          <h1>로그인이 필요합니다.</h1>
          <p>배송지를 관리하려면 먼저 로그인해주세요.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="address-management-page">
      <section className="address-management-container">
        <header className="address-page-header">
          <div>
            <span className="address-page-eyebrow">
              DELIVERY ADDRESS
            </span>
            <h1>배송지 관리</h1>
            <p>
              주문에 사용할 배송지를 추가하고 기본 배송지를
              설정할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="address-add-button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            신규 배송지 추가
          </button>
        </header>

        {addressResult.error && (
          <div className="address-error" role="alert">
            {addressResult.error}
          </div>
        )}

        <div className="address-page-layout">
          <section className="address-list-section">
            <div className="address-list-heading">
              <h2>등록된 배송지</h2>
              <span>{addresses.length}개</span>
            </div>

            {loading ? (
              <div className="address-loading">
                배송지를 불러오는 중입니다.
              </div>
            ) : sortedAddresses.length === 0 ? (
              <div className="address-empty-state">
                <MapPin size={38} />
                <h3>등록된 배송지가 없습니다.</h3>
                <p>
                  신규 배송지를 추가하면 결제 페이지에서 바로
                  사용할 수 있습니다.
                </p>

                <button
                  type="button"
                  onClick={openCreateForm}
                >
                  <Plus size={17} />
                  첫 배송지 추가
                </button>
              </div>
            ) : (
              <div className="address-card-list">
                {sortedAddresses.map((address) => {
                  const isDefault =
                    Number(address.is_default) === 1;
                  const processing =
                    processingAddressId === address.id;

                  return (
                    <article
                      className={`address-card ${
                        isDefault ? "default" : ""
                      }`}
                      key={address.id}
                    >
                      <div className="address-card-top">
                        <div className="address-name-row">
                          <strong>
                            {address.receiver_name}
                          </strong>

                          {isDefault && (
                            <span className="default-badge">
                              <Star size={13} fill="currentColor" />
                              기본 배송지
                            </span>
                          )}
                        </div>

                        <div className="address-card-actions">
                          <button
                            type="button"
                            className="address-icon-button"
                            aria-label="배송지 수정"
                            onClick={() =>
                              openEditForm(address)
                            }
                            disabled={processing}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="address-icon-button danger"
                            aria-label="배송지 삭제"
                            onClick={() =>
                              handleDelete(address)
                            }
                            disabled={processing}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <div className="address-card-body">
                        <p>{address.call_number}</p>

                        <p className="address-main-text">
                          [{address.zip_code}]{" "}
                          {address.user_address}{" "}
                          {address.address_detail}
                        </p>

                        {address.delivery_request && (
                          <p className="address-request">
                            배송 요청사항:{" "}
                            {address.delivery_request}
                          </p>
                        )}
                      </div>

                      <div className="address-card-footer">
                        <button
                          type="button"
                          className={`set-default-button ${
                            isDefault ? "selected" : ""
                          }`}
                          onClick={() =>
                            handleSetDefault(address)
                          }
                          disabled={isDefault || processing}
                        >
                          {isDefault ? (
                            <>
                              <Check size={16} />
                              기본 배송지로 사용 중
                            </>
                          ) : (
                            "기본 배송지로 설정"
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {formMode && (
            <aside className="address-form-panel">
              <div className="address-form-header">
                <div>
                  <span>
                    {formMode === "edit"
                      ? "EDIT ADDRESS"
                      : "NEW ADDRESS"}
                  </span>
                  <h2>
                    {formMode === "edit"
                      ? "배송지 수정"
                      : "신규 배송지 추가"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="address-close-button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="입력창 닫기"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                className="address-form"
                onSubmit={handleSubmit}
              >
                <label>
                  <span>받는 사람</span>
                  <input
                    name="receiverName"
                    value={addressForm.receiverName}
                    onChange={handleInputChange}
                    placeholder="받는 사람"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>연락처</span>
                  <input
                    name="callNumber"
                    value={addressForm.callNumber}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>우편번호</span>
                  <input
                    name="zipCode"
                    value={addressForm.zipCode}
                    onChange={handleInputChange}
                    placeholder="우편번호"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>주소</span>
                  <input
                    name="userAddress"
                    value={addressForm.userAddress}
                    onChange={handleInputChange}
                    placeholder="주소"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>상세 주소</span>
                  <input
                    name="addressDetail"
                    value={addressForm.addressDetail}
                    onChange={handleInputChange}
                    placeholder="상세 주소"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>배송 요청사항</span>
                  <textarea
                    name="deliveryRequest"
                    value={addressForm.deliveryRequest}
                    onChange={handleInputChange}
                    placeholder="예: 문 앞에 놓아주세요."
                    disabled={saving}
                  />
                </label>

                <label className="address-default-checkbox">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleInputChange}
                    disabled={
                      saving ||
                      (formMode === "edit" &&
                        addressForm.isDefault)
                    }
                  />
                  <span>기본 배송지로 설정</span>
                </label>

                <div className="address-form-actions">
                  <button
                    type="button"
                    className="address-cancel-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    취소
                  </button>

                  <button
                    type="submit"
                    className="address-save-button"
                    disabled={saving}
                  >
                    {saving
                      ? "저장 중..."
                      : formMode === "edit"
                        ? "수정 완료"
                        : "배송지 저장"}
                  </button>
                </div>
              </form>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
};

export default AddressManagementPage;
