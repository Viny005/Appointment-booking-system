# Sprint 14 – Profilbild-Pipeline

Branch `feat/profile-image-pipeline`, Basis: Sprint 13.

ADMIN kann Profilbilder als JPEG, PNG oder WebP bis 5 MiB hochladen. Die Pipeline dekodiert mit einer harten Pixelgrenze von 16.777.216 Pixeln, lehnt Breite/Höhe über 4096, Animation/Mehrseitenbilder und andere Formate ab und re-encodiert serverseitig nach WebP. Das Re-Encoding übernimmt keine Eingabemetadaten. SVG und ausführbare Inhalte sind nicht Teil der erlaubten Formate.

Storage wird über `ImageStorage` abstrahiert. Der lokale Adapter akzeptiert ausschließlich servergenerierte UUID-WebP-Schlüssel, schreibt zuerst eine temporäre Datei und benennt atomar um. Ein fehlgeschlagenes Profilupdate entfernt das neue Objekt; nach erfolgreichem Update wird das alte Objekt best-effort entfernt. Browserpfade oder Dateinamen des Uploads werden nie als Storage-Key verwendet.

Der öffentliche Image-Endpunkt akzeptiert nur validierte Schlüssel und liefert ausschließlich `image/webp` mit nosniff und restriktiver CSP. Produktionsbetrieb muss `PROFILE_IMAGE_DIR` auf persistenten, gesicherten Storage legen oder einen gleichwertigen Adapter konfigurieren.
