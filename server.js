const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Servir arquivos estáticos
app.use(express.static(__dirname));
app.use('/musicas', express.static(path.join(__dirname, 'musicas')));

// API - Listar músicas
app.get('/api/tracks', (req, res) => {
  const musicDir = path.join(__dirname, 'musicas');
  
  if (!fs.existsSync(musicDir)) {
    return res.json({ tracks: [] });
  }

  const files = fs.readdirSync(musicDir).filter(f => 
    ['.mp3', '.wav', '.ogg', '.flac', '.m4a'].includes(path.extname(f).toLowerCase())
  );

  const tracks = files.map((file, i) => {
    const nameWithoutExt = file.replace(/\.\w+$/, '');
    const parts = nameWithoutExt.split(' - ');
    
    // Remover número do início se existir (ex: "01 - Artista - Titulo")
    let artist, title;
    if (parts.length >= 3 && /^\d+$/.test(parts[0].trim())) {
      artist = parts[1].trim();
      title = parts.slice(2).join(' - ').trim();
    } else if (parts.length >= 2) {
      artist = parts[0].replace(/^\d+\s*/, '').trim();
      title = parts.slice(1).join(' - ').trim();
    } else {
      artist = 'Artista Desconhecido';
      title = nameWithoutExt.replace(/^\d+\s*/, '').trim();
    }

    return {
      id: i + 1,
      title: title || nameWithoutExt,
      artist: artist || 'Artista Desconhecido',
      album: 'Minha Coleção',
      url: `/musicas/${encodeURIComponent(file)}`,
      filename: file
    };
  });

  res.json({ tracks, total: tracks.length });
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎵 JucaSound rodando em http://localhost:${PORT}`);
  console.log(`📂 Músicas: ${path.join(__dirname, 'musicas')}`);
});
