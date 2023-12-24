const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Povezivanje s bazom podataka (MySQL)
const dbConn = mysql.createConnection({
  host: "student.veleri.hr",
  user: "dvizintin",
  password: "11",
  database: "dvizintin"
});

dbConn.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
    return;
  }
  console.log('Connected to MySQL database');
});

app.post('/api/add-quote', (req, res) => {
  const citat = req.body.citat;
  const Naziv_knj = req.body.Naziv_knj;

  if (!citat || !Naziv_knj) {
    return res.status(400).json({ error: 'Molimo ispunite sva polja.' });
  }

  // Dohvati ID_Knjige na temelju imena knjige
  const knjigaQuery = 'SELECT ID_Knjige FROM Knjiga WHERE Naziv_knj = ?';
  dbConn.query(knjigaQuery, [Naziv_knj], (knjigaErr, knjigaResult) => {
    if (knjigaErr) {
      console.error('Error fetching book ID from database:', knjigaErr.message);
      return res.status(500).json({ error: 'Greška prilikom dohvaćanja knjige iz baze.' });
    }

    if (knjigaResult.length === 0) {
      return res.status(404).json({ error: 'Knjiga nije pronađena.' });
    }

    const ID_Knjige = knjigaResult[0].ID_Knjige;

    // Dodaj citat u bazu
    const citatQuery = 'INSERT INTO Citat (Citat_iz_knj, ID_Knjige) VALUES (?, ?)';
    dbConn.query(citatQuery, [citat, ID_Knjige], (citatErr, citatResult) => {
      if (citatErr) {
        console.error('Error adding quote to database:', citatErr.message);
        return res.status(500).json({ error: 'Greška prilikom dodavanja citata.' });
      }

      return res.status(200).json({ message: 'Citat uspješno dodan.' });
    });
  });
});


// API endpoint za dodavanje knjige
app.post('/api/add-book', (req, res) => {
  const naziv = req.body.naziv;
  const godina = req.body.godina;
  const zanr = req.body.zanr;
  const imeAutora = req.body.imeAutora;  
  const prezimeAutora = req.body.prezimeAutora; 

  if (!naziv || !godina || !zanr || !imeAutora || !prezimeAutora) {
    return res.status(400).json({ error: 'Molimo ispunite sva polja.' });
  }

  // Dohvati ID autora na temelju imena i prezimena
  const autorQuery = 'SELECT ID_Aut FROM Autor WHERE Ime_Aut = ? AND Prezime_Aut = ?';
  dbConn.query(autorQuery, [imeAutora, prezimeAutora], (autorErr, autorResult) => {
    if (autorErr) {
      console.error('Error fetching author ID from database:', autorErr.message);
      return res.status(500).json({ error: 'Greška prilikom dohvaćanja autora iz baze.' });
    }

    if (autorResult.length === 0) {
      return res.status(404).json({ error: 'Autor nije pronađen.' });
    }

    const autorID = autorResult[0].ID_Aut;

    // Dodaj knjigu u bazu
    const knjigaQuery = 'INSERT INTO Knjiga (Naziv_knj, Godina_izd, Zanr_knj, ID_Aut) VALUES (?, ?, ?, ?)';
    dbConn.query(knjigaQuery, [naziv, godina, zanr, autorID], (knjigaErr, knjigaResult) => {
      if (knjigaErr) {
        console.error('Error adding book to database:', knjigaErr.message);
        return res.status(500).json({ error: 'Greška prilikom dodavanja knjige.' });
      }

      return res.status(200).json({ message: 'Knjiga uspješno dodana.' });
    });
  });
});

app.post('/api/add-author', (req, res) => {
  const Ime_Aut = req.body.Ime_Aut;
  const Prezime_Aut = req.body.Prezime_Aut;

  if (!Ime_Aut || !Prezime_Aut) {
    return res.status(400).json({ error: 'Molimo ispunite sva polja.' });
  }

  // Dodaj autora u bazu
  const autorQuery = 'INSERT INTO Autor (Ime_Aut, Prezime_Aut) VALUES (?, ?)';
  dbConn.query(autorQuery, [Ime_Aut, Prezime_Aut], (autorErr, autorResult) => {
    if (autorErr) {
      console.error('Error adding author to database:', autorErr.message);
      return res.status(500).json({ error: 'Greška prilikom dodavanja autora.' });
    }

    return res.status(200).json({ message: 'Autor uspješno dodan.' });
  });
});

// Ruta za prikaz knjiga
app.get('/api/knjige', (req, res) => {
  const query = 'SELECT Naziv_knj, Godina_izd, Zanr_knj, Ime_Aut, Prezime_Aut FROM Knjiga INNER JOIN Autor ON Knjiga.ID_Aut = Autor.ID_Aut';
  dbConn.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching books from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});


// Ruta za prikaz citata
app.get('/api/citat', (req, res) => {
  const query = 'SELECT Citat_iz_knj, Naziv_knj FROM Citat INNER JOIN Knjiga ON Citat.ID_Knjige = Knjiga.ID_Knjige';
  dbConn.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching books from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// Ruta za prikaz autora
app.get('/api/autor', (req, res) => {
  const query = 'SELECT Ime_Aut, Prezime_Aut FROM Autor ';
  dbConn.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching books from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// Ruta za prikaz autora + id
app.get('/api/autor-all', (req, res) => {
  const query = 'SELECT ID_Aut, Ime_Aut, Prezime_Aut FROM Autor';
  dbConn.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching authors from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// Ruta za prikaz citata + id
app.get('/api/citat-all', (req, res) => {
  const query = 'SELECT ID_Citata, Citat_iz_knj FROM Citat';
  dbConn.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching authors from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});


// Ruta za brisanje autora
app.delete('/api/autor/del/:id', (req, res) => {
  const id = req.params.id;
  console.log('Trying to delete author with ID:', id);

  const query = 'DELETE FROM Autor WHERE ID_Aut = ?';
  dbConn.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting author from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Author deleted successfully');
    res.send('Author deleted successfully');
  });
});
// Ruta za brisanje citata
app.delete('/api/citat/del/:id', (req, res) => {
  const ID_Citata = req.params.id;
  console.log('Trying to delete citat with ID:', ID_Citata);

  const query = 'DELETE FROM Citat WHERE ID_Citata = ?';
  dbConn.query(query, [ID_Citata], (err, results) => {
    if (err) {
      console.error('Error deleting citat from database:', err.message);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Citat deleted successfully');
    res.send('Citat deleted successfully');
  });
});

// Ruta za izmjenu autora
app.put('/api/autor/update/:id', (req, res) => {
  const ID_Aut = req.params.id;
  const Ime_Aut = req.body.Ime_Aut;
  const Prezime_Aut = req.body.Prezime_Aut;

  // Provjeri jesu li uneseni potrebni podaci
  if (!Ime_Aut || !Prezime_Aut || isNaN(ID_Aut)) {
    return res.status(400).json({ error: 'Molimo ispunite sva polja.' });
  }

  // Izmijeni autora u bazi
  const query = 'UPDATE Autor SET Ime_Aut=?, Prezime_Aut=? WHERE ID_Aut=?';
  dbConn.query(query, [Ime_Aut, Prezime_Aut, ID_Aut], (err, results) => {
    if (err) {
      console.error('Error updating author in database:', err.message);
      return res.status(500).send('Internal Server Error');
    }

    // Provjeri je li autor izmijenjen
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Autor nije pronađen.' });
    }

    // Vrati uspješan odgovor
    res.status(200).send('Autor uspješno izmijenjen.');
  });
});

// Ruta za izmjenu citata
app.put('/api/citat/update/:id', (req, res) => {
  const ID_Citata = req.params.id;
  const Citat_iz_knj = req.body.Citat_iz_knj;

  // Provjeri jesu li uneseni potrebni podaci
  if ( !Citat_iz_knj || isNaN(ID_Citata)) {
    return res.status(400).json({ error: 'Molimo ispunite sva polja.' });
  }

  // Izmijeni citata u bazi
  const query = 'UPDATE Citat SET Citat_iz_knj=? WHERE ID_Citata=?';
  dbConn.query(query, [Citat_iz_knj, ID_Citata], (err, results) => {
    if (err) {
      console.error('Error updating citat in database:', err.message);
      return res.status(500).send('Internal Server Error');
    }

    // Provjeri je li citata izmijenjen
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Citat nije pronađen.' });
    }

    // Vrati uspješan odgovor
    res.status(200).send('Citat uspješno izmijenjen.');
  });
});





// Posluživanje HTML forme
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'knjige.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'autori.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'citat.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'editautori.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'editcitati.html'));
});





app.listen(port, () => {
  console.log(`Server radi na http://localhost:3000`);
});
