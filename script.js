window.SS = {
  $: s => document.querySelector(s),
  fmt: b => b > 1048576 ? (b / 1048576).toFixed(2) + " MB" : Math.round(b / 1024) + " KB",
  base: n => n.replace(/\.[^.]+$/, ""),
  dropzone(zone, input, handler) {
    input.onchange = () => input.files[0] && handler(input.files[0]);
    zone.ondragover = e => { e.preventDefault(); zone.classList.add("over"); };
    zone.ondragleave = () => zone.classList.remove("over");
    zone.ondrop = e => { e.preventDefault(); zone.classList.remove("over"); e.dataTransfer.files[0] && handler(e.dataTransfer.files[0]); };
  }
};
(() => {
  let videoLoaded = false;
  function show(name, setHash) {
    if (name !== "video") name = "image";
    document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.t === name));
    document.querySelector("#panel-image").hidden = name !== "image";
    document.querySelector("#panel-video").hidden = name !== "video";
    if (name === "video" && !videoLoaded) { // video code loads only when needed
      videoLoaded = true;
      const s = document.createElement("script"); s.src = "video.js"; document.body.appendChild(s);
    }
    if (setHash) history.replaceState(null, "", "#" + name);
  }
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => show(t.dataset.t, true));
  show(location.hash.slice(1), false);
})();
