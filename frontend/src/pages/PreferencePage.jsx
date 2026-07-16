/**
 * 파일: src/pages/PreferencePage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 사용자의 패션 취향 선택 폼을 관리합니다.
 *
 * 사용 기술
 * - useState, checkbox/radio controlled inputs
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useState } from "react";
import { Sparkles, Ruler, Weight, Palette, Shirt } from "lucide-react";
import "../assets/styles/pages/preference/PreferencePage.css";

/**
 * PreferencePage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const PreferencePage = () => {
    // prefs: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [prefs, setPrefs] = useState({
        gender: "",
        height: "",
        weight: "",
        body_form: "",
        preferred_styles: [],
        liked_colors: [],
        disliked_colors: [],
    });

    const styles = ["캐주얼", "미니멀", "스트릿", "러블리", "스포티", "댄디", "오피스룩"];
    const colors = ["블랙", "화이트", "그레이", "네이비", "베이지", "브라운", "블루", "핑크"];

    // changeValue: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const changeValue = (e) => {
        setPrefs({
            ...prefs,
            [e.target.name]: e.target.value,
        });
    };

    // toggleArrayValue: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const toggleArrayValue = (name, value) => {
        setPrefs((prev) => ({
            ...prev,
            [name]: prev[name].includes(value)
                ? prev[name].filter((item) => item !== value)
                : [...prev[name], value],
        }));
    };

    // submitPrefs: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const submitPrefs = (e) => {
        e.preventDefault();

        const requestData = {
            ...prefs,
            height: Number(prefs.height),
            weight: Number(prefs.weight),
            preferred_styles: prefs.preferred_styles.join(","),
            liked_colors: prefs.liked_colors.join(","),
            disliked_colors: prefs.disliked_colors.join(","),
        };

        console.log(requestData);
        alert("취향등록이 완료되었습니다.");
    };

    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <main className="preference-page">
            <section className="preference-card">
                <div className="preference-title">
                    <Sparkles size={36} />
                    <h1>취향등록</h1>
                    <p>입력한 정보를 바탕으로 나에게 어울리는 옷을 추천받을 수 있어요.</p>
                </div>

                <form className="preference-form" onSubmit={submitPrefs}>
                    <div className="form-group">
                        <label>성별</label>
                        <div className="radio-box">
                            <button
                                type="button"
                                className={prefs.gender === "남성" ? "selected" : ""}
                                onClick={() => setPrefs({ ...prefs, gender: "남성" })}
                            >
                                남성
                            </button>
                            <button
                                type="button"
                                className={prefs.gender === "여성" ? "selected" : ""}
                                onClick={() => setPrefs({ ...prefs, gender: "여성" })}
                            >
                                여성
                            </button>
                        </div>
                    </div>

                    <div className="two-column">
                        <div className="form-group">
                            <label><Ruler size={18} /> 키</label>
                            <input
                                type="number"
                                name="height"
                                placeholder="예: 175.5"
                                value={prefs.height}
                                onChange={changeValue}
                            />
                        </div>

                        <div className="form-group">
                            <label><Weight size={18} /> 몸무게</label>
                            <input
                                type="number"
                                name="weight"
                                placeholder="예: 68.5"
                                value={prefs.weight}
                                onChange={changeValue}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Shirt size={18} /> 체형</label>
                        <select
                            name="body_form"
                            value={prefs.body_form}
                            onChange={changeValue}
                        >
                            <option value="">체형을 선택하세요</option>
                            <option value="마른 체형">마른 체형</option>
                            <option value="보통 체형">보통 체형</option>
                            <option value="근육형">근육형</option>
                            <option value="통통한 체형">통통한 체형</option>
                            <option value="상체 발달형">상체 발달형</option>
                            <option value="하체 발달형">하체 발달형</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>선호하는 스타일</label>
                        <div className="chip-box">
                            {styles.map((style) => (
                                <button
                                    type="button"
                                    key={style}
                                    className={prefs.preferred_styles.includes(style) ? "chip selected" : "chip"}
                                    onClick={() => toggleArrayValue("preferred_styles", style)}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Palette size={18} /> 선호 색상</label>
                        <div className="chip-box">
                            {colors.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    className={prefs.liked_colors.includes(color) ? "chip selected" : "chip"}
                                    onClick={() => toggleArrayValue("liked_colors", color)}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>기피 색상</label>
                        <div className="chip-box">
                            {colors.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    className={prefs.disliked_colors.includes(color) ? "chip danger" : "chip"}
                                    onClick={() => toggleArrayValue("disliked_colors", color)}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="preference-submit">
                        취향 저장하기
                    </button>
                </form>
            </section>
        </main>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default PreferencePage;