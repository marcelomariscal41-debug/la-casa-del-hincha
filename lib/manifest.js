(function () {
  "use strict";

  window.__BRAND__ = {
    name: "La Casa del Hincha",
    tagline: "Camisetas de fútbol para los que la viven",

    // Catálogo — imágenes vacías (placeholder). Reemplaza `photo` con la ruta real
    // dentro de assets/img/ cuando tengas las fotos de producto.
    products: [
      { id: "bol-home",  name: "Bolivia Local 2025",        team: "Selección Bolivia",   cat: "seleccion",   price: 320, tag: "Nuevo",     photo: "" },
      { id: "bol-away",  name: "Bolivia Visitante 2025",    team: "Selección Bolivia",   cat: "seleccion",   price: 320, tag: "",          photo: "" },
      { id: "bol-ret",   name: "Bolivia Retro 1994",        team: "Selección Bolivia",   cat: "retro",       price: 290, tag: "Edición",   photo: "" },
      { id: "boca-home", name: "The Strongest Local",       team: "The Strongest",       cat: "clubes",      price: 300, tag: "",          photo: "" },
      { id: "bolivar",   name: "Club Bolívar Local",        team: "Club Bolívar",        cat: "clubes",      price: 300, tag: "",          photo: "" },
      { id: "oriente",   name: "Oriente Petrolero Local",   team: "Oriente Petrolero",   cat: "clubes",      price: 300, tag: "",          photo: "" },
      { id: "wilster",   name: "Wilstermann Local",         team: "Jorge Wilstermann",   cat: "clubes",      price: 300, tag: "",          photo: "" },
      { id: "arg-home",  name: "Argentina Local 2024",      team: "Selección Argentina", cat: "internacional", price: 360, tag: "Top",      photo: "" },
      { id: "esp-home",  name: "España Local 2024",         team: "Selección España",    cat: "internacional", price: 360, tag: "",         photo: "" },
      { id: "bra-home",  name: "Brasil Local 2024",         team: "Selección Brasil",    cat: "internacional", price: 360, tag: "",         photo: "" },
      { id: "rma-home",  name: "Real Madrid Local 24/25",   team: "Real Madrid",         cat: "internacional", price: 380, tag: "Top",      photo: "" },
      { id: "bar-home",  name: "FC Barcelona Local 24/25",  team: "FC Barcelona",        cat: "internacional", price: 380, tag: "",         photo: "" }
    ],

    categories: [
      { id: "todos",         label: "Todo" },
      { id: "seleccion",     label: "Selección Bolivia" },
      { id: "clubes",        label: "Clubes Bolivianos" },
      { id: "internacional", label: "Internacional" },
      { id: "retro",         label: "Retro" }
    ],

    contact: {
      whatsapp: "59170000000",
      email: "hola@lacasadelhincha.bo",
      city: "Santa Cruz de la Sierra, Bolivia"
    }
  };
})();
