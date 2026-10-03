(() => {
const {$,fmt,base,dropzone}=window.SS;
// ---------- VIDEO ----------
  let vid, vname;
  dropzone($("#vdrop"), $("#vfile"), f => {
    if (!f.type.startsWith("video/")) return alert("Please choose a video file.");
    vid = document.createElement("video"); vid.playsInline = true; vid.preload = "auto";
    vid.src = URL.createObjectURL(f); vname = base(f.name);
    vid.onloadedmetadata = () => {
      $("#vinfo").textContent = `Original: ${vid.videoWidth} x ${vid.videoHeight} px, ${Math.round(vid.duration)} s, ${fmt(f.size)}`;
      $("#vctl").hidden = false; $("#vres").hidden = true;
    };
    vid.onerror = () => alert("This video could not be read by your browser.");
  });

  $("#vgo").onclick = async () => {
    if (!window.MediaRecorder) return alert("Video conversion is not supported in this browser. Try desktop Chrome or Edge.");
    const v = vid, H = +$("#vh").value, W = Math.round(v.videoWidth * H / v.videoHeight / 2) * 2;
    const mt = ["video/mp4;codecs=avc1,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
    if (!mt) return alert("No supported video format in this browser.");
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), stream = c.captureStream(30);
    try {
      if (!v._dest) { const ac = new AudioContext(), d = ac.createMediaStreamDestination(); ac.createMediaElementSource(v).connect(d); v._dest = d; v._ac = ac; }
      await v._ac.resume(); v._dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch {}
    const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: +$("#vb").value * 1e6 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const bar = $("#vbar"); bar.hidden = false; bar.value = 0; $("#vgo").disabled = true; $("#vres").hidden = true;
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mt.split(";")[0] }), url = URL.createObjectURL(blob);
      $("#vout").textContent = `Result: ${W} x ${H} px, ${fmt(blob.size)}`;
      $("#vdl").href = url; $("#vdl").download = `${vname}-${H}p.${mt.includes("mp4") ? "mp4" : "webm"}`;
      $("#vres").hidden = false; bar.hidden = true; $("#vgo").disabled = false;
    };
    const draw = () => {
      x.drawImage(v, 0, 0, W, H); bar.value = v.currentTime / v.duration;
      if (!v.ended) requestAnimationFrame(draw);
    };
    v.onended = () => rec.stop();
    v.currentTime = 0;
    rec.start();
    try { await v.play(); draw(); } catch { rec.stop(); alert("Playback was blocked. Press Convert again."); }
  };
})();
