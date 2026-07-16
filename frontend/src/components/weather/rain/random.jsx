/**
 * 파일: src/components/weather/rain/random.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 비 애니메이션 내부에서 random 관련 계산 또는 WebGL 처리를 담당합니다.
 *
 * 사용 기술
 * - Canvas/WebGL 보조 모듈
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
export function random(from=null,to=null,interpolation=null){
    if(from==null){
      from=0;
      to=1;
    }else if(from!=null && to==null){
      to=from;
      from=0;
    }
    const delta=to-from;
  
    if(interpolation==null){
      interpolation=(n)=>{
        return n;
      }
    }
    return from+(interpolation(Math.random())*delta);
  }
  export function chance(c){
    return random()<=c;
  }