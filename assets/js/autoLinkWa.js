function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Mapping jenis kegiatan ke link grup WA
  const linkWA = {
    cp: "https://chat.whatsapp.com/DVPy7LsZkOE0TkXQGxEG5y",
    uiux: "https://chat.whatsapp.com/FWaAH98K5DxBPh24bvdQjl",
    softdev: "https://chat.whatsapp.com/IHi739y7m8xLO6KH99RwHY",
    webinar: "https://chat.whatsapp.com/C3VK2U07e0f7xr3WqE5gbd",
    seminar: "https://chat.whatsapp.com/JJk2Oc7lRmuIgeq8b1QkzG"
  };

  const jenis = getQueryParam("jenis")?.toLowerCase();
  const waButton = document.getElementById("wa-button");

  if (jenis && linkWA[jenis]) {
    waButton.href = linkWA[jenis];
	window.history.replaceState({}, "", "thanks.html");
  } else {
    alert("Kamu belum mengisi pendaftaran manapun.");
  	waButton.href = "#"; // Tidak diarahkan ke manapun
  }