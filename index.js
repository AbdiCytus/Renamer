import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';

// Daftar ekstensi file gambar yang akan diproses
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'];

// Fungsi untuk membuat jeda waktu (sleep) agar animasi terlihat natural
const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

// Fungsi menampilkan Header/Banner
const showHeader = () => {
    console.clear();
    console.log(
        chalk.cyan(
            figlet.textSync('Img Renamer', { horizontalLayout: 'full' })
        )
    );
    console.log(chalk.dim('---------------------------------------------------'));
    console.log(chalk.dim('           CLI Bulk Image Renamer Tool             '));
    console.log(chalk.dim('---------------------------------------------------\n'));
};

// Fungsi Validasi apakah path folder valid
const validateFolder = (input) => {
    if (!fs.existsSync(input)) {
        return 'Folder tidak ditemukan! Pastikan path benar.';
    }
    if (!fs.lstatSync(input).isDirectory()) {
        return 'Path yang dimasukkan bukan sebuah folder.';
    }
    return true;
};

// Logic Utama Program
const runRenamer = async () => {
    // 1. Input Folder
    const { folderPath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'folderPath',
            message: '📂 Masukkan path folder gambar:',
            validate: validateFolder,
        },
    ]);

    // Membaca isi folder
    const files = fs.readdirSync(folderPath);
    
    // Filter hanya file gambar
    const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
        console.log(chalk.yellow('\n⚠️  Tidak ada file gambar di folder tersebut.\n'));
        return askToContinue();
    }

    console.log(chalk.green(`✓ Ditemukan ${imageFiles.length} file gambar.`));

    // 2. Input Nama Baru
    const { baseName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'baseName',
            message: '📝 Masukkan nama baru untuk file (tanpa angka):',
            validate: (input) => input ? true : 'Nama file tidak boleh kosong!',
        },
    ]);

    // Konfirmasi sebelum eksekusi
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Yakin ingin merename ${imageFiles.length} file menjadi "${baseName} - [n]"?`,
            default: true,
        },
    ]);

    if (!confirm) {
        console.log(chalk.red('❌ Proses dibatalkan.'));
        return askToContinue();
    }

    // 3. Proses Rename dengan Spinner
    console.log(''); // New line
    const spinner = ora('Memulai proses rename...').start();
    
    // Simulasi delay sedikit agar terlihat prosesnya
    await sleep(800);

    let successCount = 0;
    let errorCount = 0;

    try {
        for (let i = 0; i < imageFiles.length; i++) {
            const oldFile = imageFiles[i];
            const ext = path.extname(oldFile);
            const oldPath = path.join(folderPath, oldFile);
            
            // Format nama: "Nama User - Index" (Index dimulai dari 1)
            const newFileName = `${baseName} - ${i + 1}${ext}`;
            const newPath = path.join(folderPath, newFileName);

            // Update spinner text
            spinner.text = `Renaming: ${oldFile} -> ${newFileName}`;
            
            // Lakukan Rename
            fs.renameSync(oldPath, newPath);
            successCount++;
            
            // Sedikit delay agar user bisa melihat progress (opsional, bisa dihapus jika ingin instan)
            await sleep(50); 
        }

        spinner.succeed(chalk.green('Selesai!'));
        console.log(chalk.cyan(`\n📊 Laporan:`));
        console.log(`   Berhasil: ${chalk.green(successCount)}`);
        console.log(`   Gagal   : ${chalk.red(errorCount)}`);

    } catch (error) {
        spinner.fail('Terjadi kesalahan saat memproses file.');
        console.error(chalk.red(error.message));
    }

    // 4. Tanya user mau lanjut atau udahan
    await askToContinue();
};

// Fungsi Konfirmasi Lanjut/Keluar
const askToContinue = async () => {
    console.log('');
    const { again } = await inquirer.prompt([
        {
            type: 'list',
            name: 'again',
            message: 'Apa yang ingin kamu lakukan selanjutnya?',
            choices: [
                { name: '🔄 Pilih folder lain', value: true },
                { name: '🚪 Keluar', value: false },
            ],
        },
    ]);

    if (again) {
        showHeader();
        runRenamer();
    } else {
        console.log(chalk.blue('\nTerima kasih telah menggunakan Image Renamer CLI! 👋\n'));
        process.exit(0);
    }
};

// Start Program
showHeader();
runRenamer();