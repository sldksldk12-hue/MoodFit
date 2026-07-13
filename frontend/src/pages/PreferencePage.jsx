import { useState } from "react";
import { Sparkles, Ruler, Weight, Palette, Shirt } from "lucide-react";
import "../assets/styles/PreferencePage.css";

const PreferencePage = () => {
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

    const changeValue = (e) => {
        setPrefs({
            ...prefs,
            [e.target.name]: e.target.value,
        });
    };

    const toggleArrayValue = (name, value) => {
        setPrefs((prev) => ({
            ...prev,
            [name]: prev[name].includes(value)
                ? prev[name].filter((item) => item !== value)
                : [...prev[name], value],
        }));
    };

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

export default PreferencePage;