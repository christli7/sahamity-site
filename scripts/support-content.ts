/**
 * The /support/ page: how to reach us and answers to common questions. build-legal.ts renders it
 * like the legal pages. Paragraphs starting with "• " are bullets; emails and https links become links.
 */
import type { LegalDocument } from '../../mobile/src/legal/content';

export const SUPPORT_EMAIL = 'sahamity00@gmail.com';

export const support: Record<'en' | 'id', LegalDocument & { contact: string; button: string; reply: string }> = {
  en: {
    title: 'Support',
    intro: 'Questions, problems or feedback about Sahamity on iPhone, iPad or Android? Most answers are below. If yours is not, email us and we will help.',
    contact: 'Contact us',
    button: `Email ${SUPPORT_EMAIL}`,
    reply: 'We reply in English or Indonesian, usually within 2 business days. Tell us your device, the app version (at the bottom of Settings) and the email you sign in with.',
    sections: [
      {
        heading: 'Subscriptions and billing',
        body: [
          '• Pro is a monthly or yearly subscription billed by the App Store (iPhone and iPad) or Google Play (Android). It renews automatically unless you cancel at least 24 hours before the period ends.',
          '• To cancel on iPhone or iPad: open the Settings app, tap your name, then Subscriptions, then Sahamity. On Android: open Google Play, tap your profile, then Payments & subscriptions, then Subscriptions.',
          '• Deleting the app or your Sahamity account does not cancel the subscription. Cancel it in the store to stop billing.',
          '• Refunds are handled by the store you paid with. For the App Store, request one at https://reportaproblem.apple.com. For Google Play, use your Play order history.',
        ],
      },
      {
        heading: 'Pro is not showing after I subscribed',
        body: [
          '• Make sure you are signed in to the same Sahamity account you subscribed with.',
          '• Open Settings in Sahamity and tap Restore purchases. Use the same Apple ID or Google account that paid for Pro.',
          '• If Pro still does not appear, email us with the email you sign in with and your store receipt.',
        ],
      },
      {
        heading: 'Signing in',
        body: [
          '• You can sign in with Apple, Google or email. Using the same email on each method opens the same account.',
          '• Forgot your password? Tap Forgot password? on the sign-in screen and we will email you a reset code.',
          '• You can change your password in Settings. Doing so signs out your other devices.',
        ],
      },
      {
        heading: 'Notifications',
        body: [
          '• News notifications are part of Pro. Turn them on per market (IDX and US) in Sahamity Settings.',
          '• Not getting any? Check that notifications for Sahamity are allowed in your phone settings, and that Focus or Do Not Disturb is off.',
        ],
      },
      {
        heading: 'The news and analysis',
        body: [
          '• Sahamity collects corporate actions such as acquisitions, contracts, buybacks, expansions and financing from 100+ news and official sources for IDX and US stocks. Every event links to its original article.',
          '• Free keeps 3 days of news history; Pro keeps 7 days and is refreshed every minute. Older news is deleted automatically.',
          '• The AI analysis can be wrong. It is information for decision support, not financial advice. See https://sahamity.com/disclaimer/ and https://sahamity.com/data-sources/.',
          '• Spotted a wrong figure or a missing event? Email us the link and we will check it.',
        ],
      },
      {
        heading: 'Language and appearance',
        body: ['• Sahamity is in English and Indonesian, with light, dark and system appearance. Change both anytime in Settings.'],
      },
      {
        heading: 'Your account and data',
        body: [
          '• Delete your account in the app (Settings, then Delete account) or on the web at https://sahamity.com/delete-account/. Your account and personal data are deleted permanently.',
          '• How we handle your data: https://sahamity.com/privacy/. Terms of service: https://sahamity.com/terms/.',
        ],
      },
    ],
  },
  id: {
    title: 'Bantuan',
    intro: 'Punya pertanyaan, kendala, atau masukan tentang Sahamity di iPhone, iPad, atau Android? Sebagian besar jawabannya ada di bawah. Jika belum, kirim email kepada kami dan kami akan membantu.',
    contact: 'Hubungi kami',
    button: `Email ${SUPPORT_EMAIL}`,
    reply: 'Kami membalas dalam Bahasa Indonesia atau Inggris, biasanya dalam 2 hari kerja. Sertakan perangkat Anda, versi aplikasi (di bagian bawah Pengaturan), dan email yang Anda gunakan untuk masuk.',
    sections: [
      {
        heading: 'Langganan dan pembayaran',
        body: [
          '• Pro adalah langganan bulanan atau tahunan yang ditagih oleh App Store (iPhone dan iPad) atau Google Play (Android). Langganan diperpanjang otomatis kecuali dibatalkan paling lambat 24 jam sebelum periode berakhir.',
          '• Membatalkan di iPhone atau iPad: buka aplikasi Pengaturan, ketuk nama Anda, lalu Langganan, lalu Sahamity. Di Android: buka Google Play, ketuk profil Anda, lalu Pembayaran & langganan, lalu Langganan.',
          '• Menghapus aplikasi atau akun Sahamity tidak membatalkan langganan. Batalkan di store untuk menghentikan tagihan.',
          '• Pengembalian dana ditangani oleh store tempat Anda membayar. Untuk App Store, ajukan di https://reportaproblem.apple.com. Untuk Google Play, gunakan riwayat pesanan Play Anda.',
        ],
      },
      {
        heading: 'Pro tidak muncul setelah berlangganan',
        body: [
          '• Pastikan Anda masuk ke akun Sahamity yang sama dengan yang digunakan saat berlangganan.',
          '• Buka Pengaturan di Sahamity dan ketuk Pulihkan pembelian. Gunakan Apple ID atau akun Google yang sama dengan yang membayar Pro.',
          '• Jika Pro tetap tidak muncul, kirim email berisi email akun Anda dan bukti pembayaran dari store.',
        ],
      },
      {
        heading: 'Masuk ke akun',
        body: [
          '• Anda bisa masuk dengan Apple, Google, atau email. Email yang sama di setiap metode membuka akun yang sama.',
          '• Lupa kata sandi? Ketuk Lupa kata sandi? di layar masuk dan kami akan mengirim kode reset ke email Anda.',
          '• Kata sandi bisa diganti di Pengaturan. Perangkat lain akan otomatis keluar.',
        ],
      },
      {
        heading: 'Notifikasi',
        body: [
          '• Notifikasi berita adalah bagian dari Pro. Aktifkan per pasar (BEI dan AS) di Pengaturan Sahamity.',
          '• Tidak menerima notifikasi? Pastikan notifikasi Sahamity diizinkan di pengaturan ponsel, dan mode Fokus atau Jangan Ganggu tidak aktif.',
        ],
      },
      {
        heading: 'Berita dan analisis',
        body: [
          '• Sahamity mengumpulkan aksi korporasi seperti akuisisi, kontrak, buyback, ekspansi, dan pendanaan dari 100+ sumber berita dan sumber resmi untuk saham BEI dan AS. Setiap peristiwa menautkan ke artikel aslinya.',
          '• Versi gratis menyimpan riwayat berita 3 hari; Pro menyimpan 7 hari dan diperbarui setiap menit. Berita yang lebih lama dihapus otomatis.',
          '• Analisis AI bisa keliru. Analisis ini adalah informasi pendukung keputusan, bukan nasihat keuangan. Lihat https://sahamity.com/disclaimer/ dan https://sahamity.com/data-sources/.',
          '• Menemukan angka yang salah atau peristiwa yang terlewat? Kirim tautannya lewat email dan kami akan memeriksanya.',
        ],
      },
      {
        heading: 'Bahasa dan tampilan',
        body: ['• Sahamity tersedia dalam Bahasa Indonesia dan Inggris, dengan tampilan terang, gelap, dan mengikuti sistem. Ubah kapan saja di Pengaturan.'],
      },
      {
        heading: 'Akun dan data Anda',
        body: [
          '• Hapus akun di aplikasi (Pengaturan, lalu Hapus akun) atau di web melalui https://sahamity.com/delete-account/. Akun dan data pribadi Anda dihapus permanen.',
          '• Cara kami menangani data Anda: https://sahamity.com/privacy/. Ketentuan layanan: https://sahamity.com/terms/.',
        ],
      },
    ],
  },
};
