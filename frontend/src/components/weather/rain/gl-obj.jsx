/**
 * 파일: src/components/weather/rain/gl-obj.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 비 애니메이션 내부에서 gl-obj 관련 계산 또는 WebGL 처리를 담당합니다.
 *
 * 사용 기술
 * - Canvas/WebGL 보조 모듈
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import * as WebGL from "./webgl";

function GL(canvas,options,vert,frag){
  this.init(canvas,options,vert,frag);
}
GL.prototype={
  canvas:null,
  gl:null,
  program:null,
  width:0,
  height:0,
  init(canvas,options,vert,frag){
    this.canvas=canvas;
    this.width=canvas.width;
    this.height=canvas.height;
    this.gl=WebGL.getContext(canvas,options);
    this.program=this.createProgram(vert,frag);
    this.useProgram(this.program);
  },
  createProgram(vert,frag){
    let program=WebGL.createProgram(this.gl,vert,frag);
    return program;
  },
  useProgram(program){
    this.program=program;
    this.gl.useProgram(program);
  },
  createTexture(source,i){
    return WebGL.createTexture(this.gl,source,i);
  },
  createUniform(type,name,...v){
    WebGL.createUniform(this.gl,this.program,type,name,...v);
  },
  activeTexture(i){
    WebGL.activeTexture(this.gl,i);
  },
  updateTexture(source){
    WebGL.updateTexture(this.gl,source);
  },
  draw(){
    WebGL.setRectangle(this.gl, -1, -1, 2, 2);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default GL;