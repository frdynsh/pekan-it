// PENTING: GANTI DENGAN URL WEB APP YANG ANDA DAPATKAN SETELAH DEPLOY APPS SCRIPT
const scriptURL = 'https://script.google.com/macros/s/AKfycbziHbB5GMZsPGkpAWJaD9udlFh6id-J5fEpkdzjeLeTKbxXM7GflduYfcEtx3b3MEsS/exec';

const form = document.forms['form-pendaftaran'];
const submitButton = form.querySelector('input[type="submit"]');

// Membuat elemen untuk menampilkan pesan status (loading, sukses, error)
const statusMessageContainer = document.createElement('div');
statusMessageContainer.style.marginTop = '15px';
statusMessageContainer.style.fontWeight = 'bold';
submitButton.parentElement.insertAdjacentElement('afterend', statusMessageContainer);


form.addEventListener('submit', e => {
    e.preventDefault();

    // Tampilkan status loading dan nonaktifkan tombol
    submitButton.disabled = true;
    submitButton.value = "Mengirim...";
    statusMessageContainer.style.color = 'black';
    statusMessageContainer.textContent = 'Sedang memproses data dan mengunggah file...';

    const formData = new FormData(form);
    const fileInputs = form.querySelectorAll('input[type="file"]');
    let filePromises = [];

    // Proses setiap input file untuk dibaca sebagai base64
    fileInputs.forEach(fileInput => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            let promise = new Promise((resolve, reject) => {
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

    // Setelah semua file selesai dibaca, lanjutkan pengiriman
    Promise.all(filePromises)
        .then(files => {
            files.forEach(fileData => {
                formData.append(fileData.name, fileData.value);
                formData.append(fileData.name + '_filename', fileData.filename);
            });

            // Kirim data lengkap ke Google Apps Script
            return fetch(scriptURL, {
                method: 'POST',
                body: formData,
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                statusMessageContainer.style.color = 'green';
                statusMessageContainer.textContent = "Terima kasih! Formulir Anda telah berhasil dikirim.";
                form.reset(); // Kosongkan form setelah berhasil
            } else {
                // Tangani error yang dikirim dari Apps Script
                throw new Error(data.error || 'Terjadi kesalahan yang tidak diketahui dari server.');
            }
        })
        .catch(error => {
            console.error('Error!', error.message);
            statusMessageContainer.style.color = 'red';
            statusMessageContainer.textContent = "Gagal mengirim formulir. Silakan coba lagi. Error: " + error.message;
        })
        .finally(() => {
            // Kembalikan tombol ke keadaan semula baik sukses maupun gagal
            submitButton.disabled = false;
            submitButton.value = "Kirim";
        });
});