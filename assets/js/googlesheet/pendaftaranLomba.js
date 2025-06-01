// GANTI dengan URL Web App dari Google Apps Script Anda
const scriptURL = 'https://script.google.com/macros/s/AKfycbyqdYm6pbmFPZMcbXo1UAR9XqGl2XNHk298Eng7Ak0gkZeNpGuVj-yNtYGLxvyNTTNr/exec';
const sheetDataURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYPCJbwWseJ7W1owcOtzh7ryRwheFARmgsRLRtbkNzZUArMOMWvvymDxVW7DBdt08a4E2lb8j66EDH/pub?output=csv'; // dari Sheet -> File -> Share -> Publish to Web (format CSV)

// Ambil elemen form dan tombol submit
const form = document.forms['form-pendaftaran-lomba'];
const submitButton = form.querySelector('input[type="submit"]');


form.addEventListener('submit', e => {
    e.preventDefault();

    // Tampilkan status awal
    submitButton.disabled = true;
    submitButton.value = "Mengirim...";
    alert('Sedang memproses data dan mengunggah file...');

    const formData = new FormData(form);

    // ❗️ Validasi semua input: text, textarea, select, radio, file
    let isEmpty = false;

    // Cek input biasa, textarea, dan select
    const generalInputs = form.querySelectorAll('input:not([type="radio"]):not([type="file"]), textarea, select');
    generalInputs.forEach(input => {
        if (!input.value.trim()) {
            isEmpty = true;
        }
    });

    // Cek radio button (minimal satu harus terpilih per grup name)
    const radioGroups = new Set();
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        radioGroups.add(radio.name);
    });
    radioGroups.forEach(name => {
        const radios = form.querySelectorAll(`input[type="radio"][name="${name}"]`);
        const isChecked = Array.from(radios).some(r => r.checked);
        if (!isChecked) {
            isEmpty = true;
        }
    });

    // Cek file input (minimal satu file harus dipilih per input)
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(fileInput => {
        if (fileInput.files.length === 0) {
            isEmpty = true;
        }
    });

    // Tampilkan pesan jika ada yang kosong
    if (isEmpty) {
        alert("Kamu wajib mengisi semua data yang ada.");
        submitButton.disabled = false;
        submitButton.value = "Kirim";
        return;
    }

    // Validasi nama tim dan tim lead
    const namaTim = formData.get("nama_tim")?.trim().toLowerCase();
    const timLead = formData.get("tim_lead")?.trim().toLowerCase();

    if (!namaTim || !timLead) {
        alert("Nama tim dan tim lead wajib diisi.");
        submitButton.disabled = false;
        submitButton.value = "Kirim";
        return;
    }

    // Ambil data spreadsheet untuk pengecekan duplikat
    fetch(sheetDataURL)
        .then(response => {
            if (!response.ok) throw new Error("Gagal mengakses data spreadsheet.");
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.split('\n').map(row => row.split(','));
            const header = rows[0];
            const namaTimIndex = header.indexOf("nama_tim");
            const timLeadIndex = header.indexOf("tim_lead");

            const isDuplicate = rows.some((row, i) => {
                if (i === 0) return false; // lewati header
                const nama = row[namaTimIndex]?.trim().toLowerCase();
                const lead = row[timLeadIndex]?.trim().toLowerCase();
                return nama === namaTim && lead === timLead;
            });

            if (isDuplicate) {
                alert("Data dengan nama tim dan tim lead ini sudah pernah dikirim.");
                submitButton.disabled = false;
                submitButton.value = "Kirim";
                return;
            }

            // Lanjut ke proses pengiriman
            uploadFormData(formData);
        })
        .catch(error => {
            alert("Gagal memeriksa duplikasi. Error: " + error.message);
            submitButton.disabled = false;
            submitButton.value = "Kirim";
        });
});

/**
 * Upload data form ke Google Apps Script setelah validasi berhasil.
 * @param {FormData} formData
 */
function uploadFormData(formData) {
    const fileInputs = form.querySelectorAll('input[type="file"]');
    let filePromises = [];

    fileInputs.forEach(fileInput => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            const promise = new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    resolve({
                        name: fileInput.name,
                        filename: file.name,
                        value: reader.result
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            filePromises.push(promise);
        }
    });

    Promise.all(filePromises)
        .then(files => {
            files.forEach(fileData => {
                formData.append(fileData.name, fileData.value);
                formData.append(fileData.name + '_filename', fileData.filename);
            });

            return fetch(scriptURL, {
                method: 'POST',
                body: formData,
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                alert("Terima kasih! Formulir Anda telah berhasil dikirim.");
                // ✅ AMBIL pilihan lomba dari radio input:
                const selectedEvent = form.querySelector('input[name="event"]:checked')?.value || 'form-pendaftaran-lomba';

                // ✅ Redirect ke thanks.html dengan parameter `jenis`
                setTimeout(() => {
                    window.location.href = `thanks.html?jenis=${encodeURIComponent(selectedEvent)}`;
                }, 100);
                form.reset();
            } else if (data.result === 'duplicate') {               
                alert("Nama Tim sudah terdaftar, Anda tidak bisa mendaftar menggunakan nama tim ini.");
            } else {
                throw new Error(data.error || "Kesalahan tidak diketahui dari server.");
            }
        })
        .catch(error => {           
            alert("Gagal mengirim formulir. Error: " + error.message);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.value = "Kirim";
        });
}