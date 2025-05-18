<?php
header('Content-Type: application/json');

// Récupère tous les fichiers image dans le dossier public/images/
$images = glob("images/*.{jpg,jpeg,png,gif,webp}", GLOB_BRACE);

// Formate la réponse JSON
$photoList = array_map(function($path) {
    return [
        "url" => "/" . $path,
        "caption" => basename($path)
    ];
}, $images);

// Affiche la réponse
echo json_encode($photoList);
