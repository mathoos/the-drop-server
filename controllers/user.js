const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = new User({
            email: req.body.email,
            password: hash,
            nom: req.body.nom,  
            prenom: req.body.prenom,
            genre: req.body.genre,
            profileImageUrl: req.file ? req.file.path : null, 
            profilePublicId: req.file ? req.file.filename : null
        });
        user.save()
            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
            .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
    .then(user => {
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
        .then(valid => {
            if (!valid) {
                return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET', // Utiliser la variable d'environnement
                { expiresIn: '24h' }
            );
            res.status(200).json({
                userId: user._id,
                token: token
            });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getUserInfo = (req, res, next) => {
    const userId = req.auth.userId;  // Récupère l'ID de l'utilisateur authentifié (depuis le middleware d'authentification)
    
    User.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé !' });
            }
            res.status(200).json({
                nom: user.nom,
                prenom: user.prenom,
                genre: user.genre,
                profileImageUrl: user.profileImageUrl,  // Inclure l'URL de l'image de profil
                profilePublicId: user.profilePublicId
            });
        })
        .catch(error => res.status(500).json({ error }));
};


exports.updateUserInfo = async (req, res, next) => {
    const userId = req.auth.userId;  

    const updatedData = {
        nom: req.body.nom,
        prenom: req.body.prenom,
        genre: req.body.genre
    };

    if (req.file) {
        // Mise à jour de l'image de profil
        updatedData.profileImageUrl = req.file.path;
        updatedData.profilePublicId = req.file.filename; 

        // Optionnel : Vous pouvez supprimer l'ancienne image de Cloudinary ici si nécessaire
        // Vous pouvez récupérer l'ancien publicId et le supprimer
        const user = await User.findById(userId);
        if (user && user.profilePublicId) {
            await cloudinary.uploader.destroy(user.profilePublicId);
        }
    }

    try {
        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }
        res.status(200).json({ message: 'Profil mis à jour avec succès !', user });
    } catch (error) {
        res.status(500).json({ error });
    }
};