KXTuningShop - versiune conectată la Supabase

Configurat:
- Supabase URL + Publishable key
- site public: servicii, lucrări, produse, cereri ofertă
- panou admin cu autentificare Supabase
- CRUD pentru produse, servicii și lucrări
- cererile de ofertă sunt salvate în Supabase
- WhatsApp: 0753911677

IMPORTANT:
1. Publishable key poate fi folosită în frontend. NU introduce niciodată service_role/secret key în site.
2. Pentru modificări din admin, RLS trebuie să permită operații pentru utilizatorii autentificați. Într-un proiect cu un singur admin, dezactivează sign-up public din Authentication settings.
3. Pentru imagini recomandăm Supabase Storage + politici RLS; momentan formularele folosesc URL de imagine.
4. Site-ul trebuie publicat pe Vercel după ce este pus într-un repository Git.
