export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  flag: string; // emoji flag derived from code
  cities: string[];
}

// Converts ISO 3166-1 alpha-2 code to flag emoji (e.g. "US" → "🇺🇸")
const codeToFlag = (code: string): string =>
  [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');

const _raw: Omit<Country, 'flag'>[] = [
  {
    name: "Afghanistan",
    code: "AF",
    cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Kunduz", "Jalalabad", "Ghazni", "Balkh", "Baghlan", "Farah", "Lashkar Gah", "Taloqan", "Zaranj", "Pul-e-Khumri", "Sheberghan", "Gardez", "Khost", "Maymana", "Charikar", "Asadabad"],
  },
  {
    name: "Albania",
    code: "AL",
    cities: ["Tirana", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", "Lushnjë", "Kavajë", "Gjirokastër", "Sarandë", "Lezhë", "Pogradec", "Kukës", "Laç", "Peshkopi", "Burrel", "Gramsh", "Përmet"],
  },
  {
    name: "Algeria",
    code: "DZ",
    cities: ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "Skikda", "Tiaret", "Béjaïa", "Tlemcen", "Bordj Bou Arréridj", "Souk Ahras", "Mostaganem", "Médéa", "El Oued", "Ouargla", "Guelma", "Mascara", "M'Sila", "Béchar", "Chlef", "Jijel", "Khenchela", "Tamanrasset", "Adrar"],
  },
  {
    name: "Andorra",
    code: "AD",
    cities: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria", "La Massana", "Canillo", "Ordino", "Arinsal", "Pas de la Casa", "El Tarter"],
  },
  {
    name: "Angola",
    code: "AO",
    cities: ["Luanda", "Huambo", "Lobito", "Benguela", "Kuito", "Lubango", "Malanje", "Namibe", "Soyo", "Cabinda", "Uíge", "Saurimo", "Sumbe", "Dundo", "Ndalatando", "Menongue", "Luena", "Caxito", "Mbanza Kongo", "Ondjiva"],
  },
  {
    name: "Antigua and Barbuda",
    code: "AG",
    cities: ["Saint John's", "All Saints", "Liberta", "Potter's Village", "Bolans", "Codrington", "Falmouth", "Parham", "Old Road", "Piggotts"],
  },
  {
    name: "Argentina",
    code: "AR",
    cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Tucumán", "La Plata", "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Resistencia", "Santiago del Estero", "Corrientes", "Posadas", "Bahía Blanca", "Neuquén", "Paraná", "Formosa", "San Luis", "La Rioja", "Río Cuarto", "Comodoro Rivadavia", "Concordia", "Quilmes", "San Miguel de Tucumán", "Lomas de Zamora", "Lanús", "Almirante Brown", "Merlo", "General San Martín", "Florencio Varela", "Tres de Febrero", "Morón", "Berazategui", "Malvinas Argentinas", "Tigre", "San Isidro", "Vicente López", "Avellaneda", "Moreno"],
  },
  {
    name: "Armenia",
    code: "AM",
    cities: ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Kapan", "Gavarr", "Artashat", "Armavir", "Goris", "Sevan", "Ijevan", "Charentsavan", "Masis", "Ashtarak", "Stepanavan", "Sisian", "Jermuk", "Dilijan"],
  },
  {
    name: "Australia",
    code: "AU",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong", "Hobart", "Geelong", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo", "Albury", "Launceston", "Mackay", "Rockhampton", "Bunbury", "Bundaberg", "Coffs Harbour", "Wagga Wagga", "Hervey Bay", "Mildura", "Shepparton", "Port Macquarie", "Gladstone", "Tamworth", "Traralgon", "Orange", "Dubbo", "Geraldton", "Nowra", "Bathurst", "Warrnambool", "Whyalla"],
  },
  {
    name: "Austria",
    code: "AT",
    cities: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn", "Wiener Neustadt", "Steyr", "Feldkirch", "Bregenz", "Leoben", "Klosterneuburg", "Baden bei Wien", "Wolfsberg", "Leonding", "Krems an der Donau", "Traun", "Amstetten", "Kapfenberg", "Mödling", "Lustenau", "Hallein", "Kufstein", "Traiskirchen", "Schwechat", "Braunau am Inn"],
  },
  {
    name: "Azerbaijan",
    code: "AZ",
    cities: ["Baku", "Ganja", "Sumqayıt", "Mingachevir", "Lankaran", "Shirvan", "Nakhchivan", "Shaki", "Yevlakh", "Khankendi", "Aghjabadi", "Beylagan", "Barda", "Quba", "Qusar", "Saatli", "Imishli", "Tovuz", "Shamkir", "Goychay"],
  },
  {
    name: "Bahamas",
    code: "BS",
    cities: ["Nassau", "Lucaya", "Freeport", "West End", "Coopers Town", "Marsh Harbour", "Nichollstown", "Alice Town", "Duncan Town", "Matthew Town"],
  },
  {
    name: "Bahrain",
    code: "BH",
    cities: ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra", "Budaiya", "Jidhafs", "Hidd", "Zallaq", "Malkiya", "Tubli", "Sanabis", "Bilad Al Qadeem"],
  },
  {
    name: "Bangladesh",
    code: "BD",
    cities: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Comilla", "Rangpur", "Mymensingh", "Narayanganj", "Gazipur", "Tongi", "Jessore", "Bogra", "Dinajpur", "Nawabganj", "Pabna", "Tangail", "Sirajganj", "Faridpur", "Brahmanbaria", "Chandpur", "Feni", "Noakhali", "Cox's Bazar", "Jamalpur", "Netrokona", "Kishorganj", "Narsingdi", "Munshiganj"],
  },
  {
    name: "Barbados",
    code: "BB",
    cities: ["Bridgetown", "Speightstown", "Oistins", "Bathsheba", "Holetown", "Crane", "Worthing", "Christchurch", "Saint Lawrence", "Wildey"],
  },
  {
    name: "Belarus",
    code: "BY",
    cities: ["Minsk", "Homyel", "Vitebsk", "Mahilyow", "Hrodna", "Brest", "Babruysk", "Baranavichy", "Pinsk", "Orsha", "Mazyr", "Salihorsk", "Maladzyechna", "Navapolatsk", "Lida", "Polatsk", "Zhlobin", "Svetlahorsk", "Vawkavysk", "Bialynichy"],
  },
  {
    name: "Belgium",
    code: "BE",
    cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière", "Kortrijk", "Hasselt", "Sint-Niklaas", "Ostend", "Tournai", "Genk", "Seraing", "Roeselare", "Verviers", "Mouscron", "Dendermonde", "Beringen", "Turnhout", "Dilbeek", "Lier", "Heist-op-den-Berg", "Geel", "Lommel"],
  },
  {
    name: "Belize",
    code: "BZ",
    cities: ["Belize City", "San Ignacio", "Orange Walk", "Belmopan", "Dangriga", "Corozal", "Punta Gorda", "Benque Viejo del Carmen", "San Pedro", "Caye Caulker"],
  },
  {
    name: "Benin",
    code: "BJ",
    cities: ["Cotonou", "Abomey-Calavi", "Djougou", "Porto-Novo", "Parakou", "Bohicon", "Kandi", "Natitingou", "Ouidah", "Lokossa", "Malanville", "Nikki", "Savalou", "Save", "Aplahoue"],
  },
  {
    name: "Bhutan",
    code: "BT",
    cities: ["Thimphu", "Phuntsholing", "Punakha", "Wangdue Phodrang", "Samdrup Jongkhar", "Gelephu", "Mongar", "Trongsa", "Bumthang", "Paro"],
  },
  {
    name: "Bolivia",
    code: "BO",
    cities: ["Santa Cruz de la Sierra", "La Paz", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "Sacaba", "El Alto", "Quillacollo", "Warnes", "Montero", "Trinidad", "Cobija", "Yacuiba", "Riberalta", "Camiri", "Villamontes", "Llallagua", "Huanuni"],
  },
  {
    name: "Bosnia and Herzegovina",
    code: "BA",
    cities: ["Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Bijeljina", "Mostar", "Prijedor", "Brčko", "Bihać", "Doboj", "Cazin", "Trebinje", "Lukavac", "Travnik", "Zavidovići", "Foča", "Konjic", "Bugojno", "Visoko", "Gračanica"],
  },
  {
    name: "Botswana",
    code: "BW",
    cities: ["Gaborone", "Francistown", "Molepolole", "Maun", "Serowe", "Kanye", "Selebi-Phikwe", "Mahalapye", "Lobatse", "Palapye", "Mochudi", "Mogwase", "Jwaneng", "Kasane", "Letlhakane"],
  },
  {
    name: "Brazil",
    code: "BR",
    cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre", "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina", "Campo Grande", "Nova Iguaçu", "São Bernardo do Campo", "João Pessoa", "Santo André", "Osasco", "Jaboatão dos Guararapes", "Contagem", "Ribeirão Preto", "Uberlândia", "Sorocaba", "Aracaju", "Cuiabá", "Feira de Santana", "Juiz de Fora", "Joinville", "Aparecida de Goiânia", "Londrina", "Ananindeua", "Santos", "Niterói", "Serra", "Florianópolis", "Macapá", "Porto Velho", "Caxias do Sul", "Mauá", "São José dos Campos", "Betim", "Mogi das Cruzes", "Diadema", "Campina Grande", "Carapicuíba", "Piracicaba", "Montes Claros", "Belford Roxo", "Olinda", "Canoas", "São José do Rio Preto", "Boa Vista"],
  },
  {
    name: "Brunei",
    code: "BN",
    cities: ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong", "Bangar", "Muara"],
  },
  {
    name: "Bulgaria",
    code: "BG",
    cities: ["Sofia", "Plovdiv", "Varna", "Burgas", "Rousse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen", "Pernik", "Haskovo", "Yambol", "Pazardzhik", "Blagoevgrad", "Velikо Tarnovo", "Vratsa", "Gabrovo", "Asenovgrad", "Montana", "Kardzhali", "Lovech", "Targovishte", "Silistra", "Vidin", "Razgrad", "Dupnitsa", "Kyustendil", "Petrich", "Smolyan"],
  },
  {
    name: "Burkina Faso",
    code: "BF",
    cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Pouytenga", "Kaya", "Tenkodogo", "Fada N'Gourma", "Houndé", "Dédougou", "Gaoua", "Ziniaré", "Kongoussi", "Réo"],
  },
  {
    name: "Burundi",
    code: "BI",
    cities: ["Bujumbura", "Muyinga", "Gitega", "Ruyigi", "Ngozi", "Rumonge", "Makamba", "Kayanza", "Cibitoke", "Bubanza", "Kirundo", "Muramvya"],
  },
  {
    name: "Cabo Verde",
    code: "CV",
    cities: ["Praia", "Mindelo", "Santa Maria", "Assomada", "Pedra Badejo", "São Filipe", "Sal Rei", "Porto Novo", "Ribeira Grande", "Tarrafal"],
  },
  {
    name: "Cambodia",
    code: "KH",
    cities: ["Phnom Penh", "Siem Reap", "Preah Sihanouk", "Battambang", "Kampong Cham", "Krong Chbar Mon", "Pursat", "Kratie", "Kampot", "Takeo", "Prey Veng", "Svay Rieng", "Pailin", "Kampong Thom", "Stung Treng"],
  },
  {
    name: "Cameroon",
    code: "CM",
    cities: ["Douala", "Yaoundé", "Bamenda", "Bafoussam", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Loum", "Kumba", "Edéa", "Nkongsamba", "Kumbo", "Buea", "Ebolowa", "Kribi", "Foumban", "Dschang", "Mbouda", "Mbalmayo"],
  },
  {
    name: "Canada",
    code: "CA",
    cities: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "Sherbrooke", "St. John's", "Barrie", "Kelowna", "Abbotsford", "Sudbury", "Kingston", "Saguenay", "Trois-Rivières", "Guelph", "Moncton", "Brantford", "Saint John", "Thunder Bay", "Nanaimo", "Chatham-Kent", "Fredericton", "Red Deer", "Lethbridge", "Medicine Hat", "Kamloops", "Prince George", "Chilliwack", "Belleville", "Peterborough", "Sarnia", "Sault Ste. Marie", "Whitby", "Ajax", "Pickering", "Burnaby", "Surrey", "Mississauga", "Brampton", "Markham", "Vaughan", "Richmond Hill"],
  },
  {
    name: "Central African Republic",
    code: "CF",
    cities: ["Bangui", "Bimbo", "Mbaïki", "Berberati", "Kaga-Bandoro", "Bambari", "Bossangoa", "Bangassou", "Nola", "Bouar", "Carnot", "Sibut", "Bria", "Ndélé", "Bozoum"],
  },
  {
    name: "Chad",
    code: "TD",
    cities: ["N'Djamena", "Moundou", "Sarh", "Abéché", "Kelo", "Koumra", "Pala", "Am Timan", "Bongor", "Doba", "Mongo", "Ati", "Oum Hadjer", "Moussoro", "Faya-Largeau"],
  },
  {
    name: "Chile",
    code: "CL",
    cities: ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Chillán", "Iquique", "Puerto Montt", "Coquimbo", "Osorno", "Quilpué", "Calama", "Curicó", "Copiapó", "Los Ángeles", "Valdivia", "San Antonio", "Punta Arenas", "Quillota", "Viña del Mar", "Puente Alto", "Maipú", "La Florida", "Las Condes", "Ñuñoa", "Providencia"],
  },
  {
    name: "China",
    code: "CN",
    cities: ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Tianjin", "Wuhan", "Xi'an", "Hangzhou", "Nanjing", "Chongqing", "Dongguan", "Foshan", "Shenyang", "Harbin", "Qingdao", "Dalian", "Jinan", "Zhengzhou", "Kunming", "Changchun", "Changsha", "Suzhou", "Nanchang", "Shijiazhuang", "Taiyuan", "Urumqi", "Guiyang", "Ningbo", "Hefei", "Wuxi", "Nanning", "Fuzhou", "Lanzhou", "Zibo", "Tangshan", "Xiamen", "Baotou", "Wenzhou", "Handan", "Linyi", "Yantai", "Weifang", "Huainan", "Nanchong", "Zhuhai", "Shantou", "Luoyang", "Liuzhou", "Xuzhou", "Wuhan", "Changzhou", "Quanzhou", "Hohhot", "Xingtai", "Haikou", "Shaoxing", "Lanzhou", "Jilin", "Daqing", "Anshan", "Fushun", "Benxi", "Dandong", "Lüshunkou", "Yingkou", "Jinzhou", "Fuxin", "Liaoyang", "Panjin", "Tieling", "Chaoyang", "Huludao", "Sanya", "Lhasa", "Xining"],
  },
  {
    name: "Colombia",
    code: "CO",
    cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué", "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "Floridablanca", "Soledad", "Itagüí", "Buenaventura", "Barrancabermeja", "Palmira", "Bello", "Tunja", "Quibdó", "Riohacha", "Mocoa"],
  },
  {
    name: "Comoros",
    code: "KM",
    cities: ["Moroni", "Moutsamoudou", "Fomboni", "Domoni", "Tsémbehou", "Ouani"],
  },
  {
    name: "Congo (Republic)",
    code: "CG",
    cities: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Kinshasa-Brazzaville", "Impfondo", "Ouesso", "Owando", "Sibiti", "Mossendjo"],
  },
  {
    name: "Congo (DRC)",
    code: "CD",
    cities: ["Kinshasa", "Lubumbashi", "Goma", "Mbuji-Mayi", "Kisangani", "Bukavu", "Kananga", "Likasi", "Kolwezi", "Tshikapa", "Bunia", "Uvira", "Beni", "Matadi", "Bandundu", "Mbandaka", "Kalemie", "Kikwit", "Mwene-Ditu", "Gemena"],
  },
  {
    name: "Costa Rica",
    code: "CR",
    cities: ["San José", "Alajuela", "Cartago", "Heredia", "Liberia", "Puntarenas", "Limón", "San Carlos", "Pérez Zeledón", "Nicoya", "Palmares", "Puriscal", "Turrialba", "Santa Cruz", "Cañas"],
  },
  {
    name: "Croatia",
    code: "HR",
    cities: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Slavonski Brod", "Pula", "Karlovac", "Sisak", "Šibenik", "Varaždin", "Dubrovnik", "Bjelovar", "Petrinja", "Vinkovci", "Vukovar", "Koprivnica", "Čakovec", "Kutina", "Požega"],
  },
  {
    name: "Cuba",
    code: "CU",
    cities: ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Guantánamo", "Bayamo", "Las Tunas", "Cienfuegos", "Pinar del Río", "Matanzas", "Ciego de Ávila", "Sancti Spíritus", "Manzanillo", "Nuevitas", "Trinidad", "Morón", "Palma Soriano", "Moa", "Banes"],
  },
  {
    name: "Cyprus",
    code: "CY",
    cities: ["Nicosia", "Limassol", "Larnaca", "Famagusta", "Paphos", "Kyrenia", "Morphou", "Paralimni", "Strovolos", "Aglantzia"],
  },
  {
    name: "Czech Republic",
    code: "CZ",
    cities: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "Ústí nad Labem", "České Budějovice", "Hradec Králové", "Pardubice", "Zlín", "Havířov", "Kladno", "Most", "Opava", "Frýdek-Místek", "Karviná", "Jihlava", "Teplice", "Děčín", "Chomutov", "Přerov", "Jablonec nad Nisou", "Mladá Boleslav", "Prostějov", "Třebíč", "Nový Jičín", "Česká Lípa", "Rychnov nad Kněžnou", "Kolín"],
  },
  {
    name: "Denmark",
    code: "DK",
    cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Frederiksberg", "Esbjerg", "Gentofte", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Høje-Taastrup", "Silkeborg", "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro", "Taastrup", "Slagelse", "Hillerød", "Holbæk", "Helsingør", "Ikast", "Skive", "Sønderborg", "Ringsted", "Svendborg"],
  },
  {
    name: "Djibouti",
    code: "DJ",
    cities: ["Djibouti City", "Ali Sabieh", "Dikhil", "Tadjourah", "Obock", "Arta"],
  },
  {
    name: "Dominica",
    code: "DM",
    cities: ["Roseau", "Portsmouth", "Marigot", "Berekua", "Mahaut", "Saint Joseph", "Wesley", "Canefield"],
  },
  {
    name: "Dominican Republic",
    code: "DO",
    cities: ["Santo Domingo", "Santiago de los Caballeros", "Santo Domingo Este", "Santo Domingo Oeste", "Santo Domingo Norte", "San Pedro de Macorís", "La Romana", "San Cristóbal", "Puerto Plata", "San Francisco de Macorís", "La Vega", "Mao", "Barahona", "Boca Chica", "San Juan de la Maguana", "Higüey", "Moca", "Cotuí", "Monte Cristi", "Azua"],
  },
  {
    name: "Ecuador",
    code: "EC",
    cities: ["Guayaquil", "Quito", "Cuenca", "Santo Domingo de los Colorados", "Machala", "Manta", "Portoviejo", "Ambato", "Riobamba", "Esmeraldas", "Ibarra", "Loja", "Durán", "Quevedo", "Latacunga", "Milagro", "Nueva Loja", "Babahoyo", "Sangolquí", "Tulcán"],
  },
  {
    name: "Egypt",
    code: "EG",
    cities: ["Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura", "Tanta", "Asyut", "Ismailia", "Fayyum", "Zagazig", "Damietta", "Aswan", "Minya", "Damanhur", "Mahalla", "Beni Suef", "Hurghada", "Sohag", "Qena", "Shibin El Kom", "Bilbas", "Arish", "Girga", "Akhim", "Kafr el-Sheikh", "Banha", "Sadat City", "10th of Ramadan City", "Obour", "Badr", "New Cairo", "Sharm El Sheikh"],
  },
  {
    name: "El Salvador",
    code: "SV",
    cities: ["San Salvador", "Santa Ana", "Soyapango", "San Miguel", "Mejicanos", "Santa Tecla", "Apopa", "Delgado", "Ilopango", "Usulután", "Chalatenango", "San Vicente", "Zacatecoluca", "La Unión", "Ahuachapán"],
  },
  {
    name: "Equatorial Guinea",
    code: "GQ",
    cities: ["Malabo", "Bata", "Ebebiyín", "Aconibe", "Añisoc", "Luba", "Mongomo", "Evinayong", "Mbini", "Mikomeseng"],
  },
  {
    name: "Eritrea",
    code: "ER",
    cities: ["Asmara", "Keren", "Massawa", "Assab", "Mendefera", "Dekemhare", "Adi Keyh", "Adi Quala", "Barentu", "Tessenei"],
  },
  {
    name: "Estonia",
    code: "EE",
    cities: ["Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", "Sillamäe", "Maardu", "Võru", "Valga", "Jõhvi", "Haapsalu", "Kuressaare", "Paide"],
  },
  {
    name: "Eswatini",
    code: "SZ",
    cities: ["Mbabane", "Manzini", "Lobamba", "Big Bend", "Nhlangano", "Siteki", "Pigg's Peak", "Hluti", "Vuvulane", "Siphofaneni"],
  },
  {
    name: "Ethiopia",
    code: "ET",
    cities: ["Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Awasa", "Adama", "Bahir Dar", "Jimma", "Jijiga", "Shashamane", "Bishoftu", "Arba Minch", "Hosaena", "Harar", "Dilla", "Nekemte", "Debre Birhan", "Dessie", "Debre Markos", "Asella", "Weldiya", "Sodo", "Axum", "Lalibela", "Gambela"],
  },
  {
    name: "Fiji",
    code: "FJ",
    cities: ["Suva", "Lautoka", "Nadi", "Labasa", "Ba", "Levuka", "Sigatoka", "Tavua", "Savusavu", "Rakiraki"],
  },
  {
    name: "Finland",
    code: "FI",
    cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hämeenlinna", "Vaasa", "Seinäjoki", "Rovaniemi", "Mikkeli", "Kotka", "Salo", "Porvoo", "Kokkola", "Hyvinkää", "Lohja", "Järvenpää", "Rauma", "Kerava", "Kajaani", "Savonlinna", "Iisalmi"],
  },
  {
    name: "France",
    code: "FR",
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Le Mans", "Clermont-Ferrand", "Aix-en-Provence", "Brest", "Limoges", "Tours", "Amiens", "Perpignan", "Metz", "Besançon", "Boulogne-Billancourt", "Orléans", "Rouen", "Mulhouse", "Caen", "Nancy", "Saint-Denis", "Argenteuil", "Montreuil", "Roubaix", "Tourcoing", "Avignon", "Nanterre", "Créteil", "Vitry-sur-Seine", "Dunkerque", "Poitiers", "Versailles", "Pau", "Courbevoie", "Colombes"],
  },
  {
    name: "Gabon",
    code: "GA",
    cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Mouila", "Lambaréné", "Tchibanga", "Koulamoutou", "Makokou"],
  },
  {
    name: "Gambia",
    code: "GM",
    cities: ["Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni", "Lamin", "Sukuta", "Gunjur", "Basse Santa Su", "Janjanbureh"],
  },
  {
    name: "Georgia",
    code: "GE",
    cities: ["Tbilisi", "Kutaisi", "Batumi", "Rustavi", "Zugdidi", "Gori", "Poti", "Samtredia", "Khashuri", "Senaki", "Zestaponi", "Marneuli", "Telavi", "Akhaltsikhe", "Ozurgeti", "Kaspi", "Tkibuli", "Tskhinvali", "Ambrolauri", "Borjomi"],
  },
  {
    name: "Germany",
    code: "DE",
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Gelsenkirchen", "Mönchengladbach", "Braunschweig", "Chemnitz", "Kiel", "Aachen", "Halle", "Magdeburg", "Freiburg im Breisgau", "Krefeld", "Lübeck", "Oberhausen", "Erfurt", "Mainz", "Rostock", "Kassel", "Hagen", "Hamm", "Saarbrücken", "Mülheim an der Ruhr", "Potsdam", "Ludwigshafen", "Oldenburg", "Leverkusen", "Osnabrück", "Solingen", "Heidelberg", "Darmstadt", "Paderborn", "Regensburg", "Würzburg", "Ingolstadt", "Göttingen", "Wolfsburg", "Ulm", "Heilbronn"],
  },
  {
    name: "Ghana",
    code: "GH",
    cities: ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Ashaiman", "Sunyani", "Cape Coast", "Obuasi", "Teshie", "Madina", "Koforidua", "Ho", "Wa", "Bolgatanga", "Tema", "Nkawkaw", "Berekum", "Dunkwa-on-Offin", "Nkoranza", "Techiman"],
  },
  {
    name: "Greece",
    code: "GR",
    cities: ["Athens", "Thessaloniki", "Patras", "Piraeus", "Larissa", "Heraklion", "Peristeri", "Kallithea", "Acharnes", "Kalamaria", "Nikaia", "Glyfada", "Volos", "Ilio", "Ilioupoli", "Keratsini", "Evosmos", "Chalandri", "Nea Smyrni", "Marousi", "Agios Dimitrios", "Egaleo", "Vyronas", "Koridallos", "Zografou", "Xanthi", "Kavala", "Chania", "Chalcis", "Serres", "Alexandroupoli", "Katerini", "Lamia", "Ioannina", "Irakleion", "Rhodes"],
  },
  {
    name: "Grenada",
    code: "GD",
    cities: ["St. George's", "Gouyave", "Grenville", "Victoria", "Hillsborough", "Sauteurs", "Saint David's", "Grand Roy"],
  },
  {
    name: "Guatemala",
    code: "GT",
    cities: ["Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "San Juan Sacatepéquez", "Chinautla", "Escuintla", "Villa Canales", "Petapa", "Cobán", "Huehuetenango", "Chiquimula", "Santa Lucía Cotzumalguapa", "Puerto Barrios", "Jalapa", "Flores", "Mazatenango", "Zacapa", "Totonicapán", "Sanarate"],
  },
  {
    name: "Guinea",
    code: "GN",
    cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Guékédou", "Mamou", "Kissidougou", "Faranah", "Boké", "Télimélé", "Dalaba", "Macenta", "Pita", "Siguiri"],
  },
  {
    name: "Guinea-Bissau",
    code: "GW",
    cities: ["Bissau", "Bafatá", "Gabu", "Bissorã", "Bolama", "Cacheu", "Bubaque", "Farim", "Mansôa", "Quebo"],
  },
  {
    name: "Guyana",
    code: "GY",
    cities: ["Georgetown", "Linden", "New Amsterdam", "Anna Regina", "Bartica", "Skeldon", "Rosignol", "Mabaruma", "Mahdia", "Lethem"],
  },
  {
    name: "Haiti",
    code: "HT",
    cities: ["Port-au-Prince", "Carrefour", "Delmas", "Pétionville", "Léogâne", "Cap-Haïtien", "Gonaïves", "Saint-Marc", "Les Cayes", "Port-de-Paix", "Jacmel", "Hinche", "Fort-Liberté", "Miragoâne", "Jérémie"],
  },
  {
    name: "Honduras",
    code: "HN",
    cities: ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso", "Choluteca", "Comayagua", "Puerto Cortés", "La Lima", "Danlí", "Juticalpa", "Santa Rosa de Copán", "Tocoa", "Siguatepeque", "Tela", "Villanueva", "Olanchito", "Catacamas", "San Lorenzo", "Nacaome"],
  },
  {
    name: "Hungary",
    code: "HU",
    cities: ["Budapest", "Debrecen", "Miskolc", "Szeged", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár", "Szombathely", "Szolnok", "Tatabánya", "Kaposvár", "Érd", "Veszprém", "Zalaegerszeg", "Sopron", "Eger", "Nagykanizsa", "Dunakeszi", "Hódmezővásárhely", "Békéscsaba", "Jászberény", "Gödöllő", "Mosonmagyaróvár", "Keszthely", "Esztergom", "Oroszlány", "Salgótarján", "Ajka"],
  },
  {
    name: "Iceland",
    code: "IS",
    cities: ["Reykjavik", "Kópavogur", "Hafnarfjörður", "Akureyri", "Garðabær", "Mosfellsbær", "Selfoss", "Vestmannaeyjar", "Akranes", "Ísafjörður"],
  },
  {
    name: "India",
    code: "IN",
    cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubballi-Dharwad", "Tiruchirappalli", "Bareilly", "Mysore", "Thiruvananthapuram", "Tiruppur", "Gurgaon", "Aligarh", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Siliguri", "Maheshtala", "Mangalore", "Jamuia", "Udaipur", "Erode", "Gulbarga", "Jhansi", "Ujjain"],
  },
  {
    name: "Indonesia",
    code: "ID",
    cities: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Tangerang", "Depok", "Semarang", "Palembang", "Makassar", "South Tangerang", "Batam", "Bogor", "Pekanbaru", "Bandar Lampung", "Malang", "Padang", "Denpasar", "Samarinda", "Tasikmalaya", "Pontianak", "Balikpapan", "Banjarmasin", "Serang", "Mataram", "Jambi", "Surakarta", "Manado", "Yogyakarta", "Kupang", "Ambon", "Ternate", "Sorong", "Jayapura", "Manokwari", "Palu", "Kendari", "Gorontalo", "Bengkulu", "Palangka Raya"],
  },
  {
    name: "Iran",
    code: "IR",
    cities: ["Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz", "Kermanshah", "Urmia", "Rasht", "Zahedan", "Hamadan", "Kerman", "Arak", "Yazd", "Ardabil", "Bandar Abbas", "Qazvin", "Zanjan", "Sanandaj", "Khorramabad", "Sari", "Gorgan", "Ilam", "Birjand", "Shahrekord", "Boushehr", "Semnan", "Babol"],
  },
  {
    name: "Iraq",
    code: "IQ",
    cities: ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf", "Karbala", "Kirkuk", "Sulaymaniyah", "Tikrit", "Fallujah", "Ramadi", "Baquba", "Amarah", "Nasiriyah", "Hillah", "Diwaniyah", "Kut", "Dohuk", "Samarra", "Baqubah"],
  },
  {
    name: "Ireland",
    code: "IE",
    cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Dundalk", "Swords", "Bray", "Navan", "Kilkenny", "Ennis", "Carlow", "Tralee", "Newbridge", "Portlaoise", "Mullingar", "Wexford", "Sligo", "Celbridge", "Clonmel", "Greystones", "Letterkenny", "Tullamore", "Killarney"],
  },
  {
    name: "Israel",
    code: "IL",
    cities: ["Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beer Sheva", "Bnei Brak", "Holon", "Bat Yam", "Ramat Gan", "Ashkelon", "Rehovot", "Herzliya", "Hadera", "Modi'in-Maccabim-Re'ut", "Nazareth", "Lod", "Ramla", "Ra'anana", "Kfar Saba", "Be'er Sheva", "Eilat", "Nahariya"],
  },
  {
    name: "Italy",
    code: "IT",
    cities: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Prato", "Reggio Calabria", "Modena", "Reggio Emilia", "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari", "Latina", "Giugliano in Campania", "Monza", "Syracuse", "Bergamo", "Pescara", "Trento", "Forlì", "Vicenza", "Terni", "Novara", "Bolzano", "Piacenza", "Ancona", "Udine", "Andria", "Arezzo", "Cesena", "Lecce", "Barletta"],
  },
  {
    name: "Jamaica",
    code: "JM",
    cities: ["Kingston", "Spanish Town", "Portmore", "Montego Bay", "May Pen", "Mandeville", "Old Harbour", "Linstead", "Half Way Tree", "Saint Ann's Bay", "Port Antonio", "Savanna-la-Mar", "Falmouth", "Morant Bay", "Black River"],
  },
  {
    name: "Japan",
    code: "JP",
    cities: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kawasaki", "Kobe", "Kyoto", "Saitama", "Hiroshima", "Sendai", "Kitakyushu", "Chiba", "Sakai", "Niigata", "Hamamatsu", "Shizuoka", "Sagamihara", "Okayama", "Kumamoto", "Funabashi", "Higashiosaka", "Kagoshima", "Hachioji", "Matsuyama", "Utsunomiya", "Matsudo", "Nara", "Kawaguchi", "Kanazawa", "Toyama", "Oita", "Nagasaki", "Gifu", "Toyohashi", "Nagano", "Matsumoto", "Wakayama", "Takamatsu", "Takasaki", "Akita", "Himeji", "Aomori", "Morioka", "Fukushima", "Yokosuka", "Kochi", "Koriyama", "Yamagata", "Asahikawa", "Hakodate"],
  },
  {
    name: "Jordan",
    code: "JO",
    cities: ["Amman", "Zarqa", "Irbid", "Russeifa", "Wadi as-Sir", "Aqaba", "Madaba", "Mafraq", "Jerash", "Ajloun", "Karak", "Tafila", "Ma'an", "Aqaba", "Salt", "Ramtha", "Azraq", "Sahab"],
  },
  {
    name: "Kazakhstan",
    code: "KZ",
    cities: ["Almaty", "Astana", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kostanay", "Kyzylorda", "Uralsk", "Petropavl", "Aktau", "Temirtau", "Taldykorgan", "Ekibastuz", "Rudny", "Zhezkazgan"],
  },
  {
    name: "Kenya",
    code: "KE",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Ruiru", "Kikuyu", "Machakos", "Meru", "Malindi", "Kitale", "Garissa", "Kisii", "Nyeri", "Thika", "Limuru", "Kakamega", "Bungoma", "Kericho", "Homa Bay", "Voi", "Wajir", "Webuye", "Iten", "Nanyuki"],
  },
  {
    name: "Kiribati",
    code: "KI",
    cities: ["Tarawa", "Betio", "Bikenibeu", "Bairiki", "Teaoraereke", "Eita"],
  },
  {
    name: "Kuwait",
    code: "KW",
    cities: ["Kuwait City", "Al Ahmadi", "Hawalli", "As Salimiyah", "Sabah as Salim", "Al Farwaniyah", "Al Fahahil", "Al Jahra", "Ar Riqqah", "Mubarak Al-Kabeer", "Salwa", "Ar Rumaythiyah"],
  },
  {
    name: "Kyrgyzstan",
    code: "KG",
    cities: ["Bishkek", "Osh", "Jalal-Abad", "Karakol", "Tokmok", "Uzgen", "Naryn", "Kant", "Batken", "Talas", "Balykchy", "Kara-Balta", "Nookat", "Cholpon-Ata"],
  },
  {
    name: "Laos",
    code: "LA",
    cities: ["Vientiane", "Pakse", "Savannakhet", "Luang Prabang", "Xam Neua", "Phonsavan", "Thakhek", "Ban Houayxay", "Muang Xay", "Sainyabuli"],
  },
  {
    name: "Latvia",
    code: "LV",
    cities: ["Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne", "Jēkabpils", "Valmiera", "Ogre", "Tukums", "Salaspils", "Kuldīga", "Cēsis", "Ludza"],
  },
  {
    name: "Lebanon",
    code: "LB",
    cities: ["Beirut", "Tripoli", "Sidon", "Tyre", "Nabatieh", "Jounieh", "Zahle", "Baalbek", "Aley", "Byblos", "Hasbaya", "Deir el Ahmar", "Jdeideh", "Halba"],
  },
  {
    name: "Lesotho",
    code: "LS",
    cities: ["Maseru", "Teyateyaneng", "Mafeteng", "Hlotse", "Mohale's Hoek", "Maputsoe", "Qacha's Nek", "Quthing", "Butha-Buthe", "Mokhotlong"],
  },
  {
    name: "Liberia",
    code: "LR",
    cities: ["Monrovia", "Gbarnga", "Kakata", "Buchanan", "Zwedru", "Harbel", "Voinjama", "Tubmanburg", "Greenville", "Barclayville"],
  },
  {
    name: "Libya",
    code: "LY",
    cities: ["Tripoli", "Benghazi", "Misrata", "Bayda", "Zawiya", "Ajdabiya", "Zliten", "Gharyan", "Sabha", "Derna", "Tobruk", "Tarhuna", "Sirte", "Bani Walid", "Murzuq"],
  },
  {
    name: "Liechtenstein",
    code: "LI",
    cities: ["Vaduz", "Schaan", "Triesen", "Balzers", "Eschen", "Mauren", "Triesenberg", "Ruggell", "Gamprin", "Schellenberg"],
  },
  {
    name: "Lithuania",
    code: "LT",
    cities: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai", "Jonava", "Utena", "Kėdainiai", "Telšiai", "Visaginas", "Tauragė", "Ukmergė", "Plungė", "Kretinga", "Radviliškis", "Skuodas", "Biržai"],
  },
  {
    name: "Luxembourg",
    code: "LU",
    cities: ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz", "Rumelange", "Grevenmacher", "Echternach"],
  },
  {
    name: "Madagascar",
    code: "MG",
    cities: ["Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga", "Toliara", "Antsiranana", "Ambovombe", "Moramanga", "Ambatondrazaka", "Manakara", "Morondava", "Fort Dauphin", "Antalaha", "Mananjary"],
  },
  {
    name: "Malawi",
    code: "MW",
    cities: ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu", "Mangochi", "Karonga", "Salima", "Nkhotakota", "Nsanje", "Balaka", "Liwonde"],
  },
  {
    name: "Malaysia",
    code: "MY",
    cities: ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Johor Bahru", "Malacca City", "Kota Kinabalu", "Kuching", "Subang Jaya", "Klang", "Ampang Jaya", "Miri", "Sandakan", "Alor Setar", "Kuala Terengganu", "Kota Bahru", "Seremban", "Sibu", "Taiping", "Tawau", "Sungai Petani", "Kangar", "Bintulu", "Kuantan"],
  },
  {
    name: "Maldives",
    code: "MV",
    cities: ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo", "Naifaru", "Dhidhdhoo", "Hulhumalé", "Maafushi", "Eydhafushi"],
  },
  {
    name: "Mali",
    code: "ML",
    cities: ["Bamako", "Sikasso", "Mopti", "Koutiala", "Ségou", "Kayes", "Gao", "Kidal", "Timbuktu", "San", "Bougouni", "Kati", "Niono", "Markala", "Koulikoro"],
  },
  {
    name: "Malta",
    code: "MT",
    cities: ["Valletta", "Birkirkara", "Mosta", "Qormi", "Żabbar", "San Ġwann", "Naxxar", "Marsaxlokk", "St. Paul's Bay", "Sliema", "St. Julian's", "Rabat", "Vittoriosa", "Mdina"],
  },
  {
    name: "Marshall Islands",
    code: "MH",
    cities: ["Majuro", "Ebeye", "Jaluit", "Wotje", "Mili"],
  },
  {
    name: "Mauritania",
    code: "MR",
    cities: ["Nouakchott", "Nouadhibou", "Rosso", "Kaédi", "Zouerate", "Kiffa", "Tidjikja", "Atar", "Selibaby", "Nema", "Aleg", "Akjoujt"],
  },
  {
    name: "Mauritius",
    code: "MU",
    cities: ["Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes", "Triolet", "Goodlands", "Centre de Flacq", "Mahebourg", "Saint Pierre"],
  },
  {
    name: "Mexico",
    code: "MX",
    cities: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Toluca", "León", "Ciudad Juárez", "Torreón", "San Luis Potosí", "Mérida", "Chihuahua", "Querétaro", "Aguascalientes", "Morelia", "Hermosillo", "Mexicali", "Culiacán", "Acapulco", "Saltillo", "Naucalpan", "Centro", "Ecatepec", "Tlalnepantla", "Nezahualcóyotl", "Chimalhuacán", "Iztapalapa", "Coyoacán", "Xochimilco", "Gustavo A. Madero", "Veracruz", "Villahermosa", "Tuxtla Gutiérrez", "Cancún", "Tepic", "Colima", "Durango", "Oaxaca", "Zacatecas", "Pachuca", "Cuernavaca", "Chetumal", "Campeche", "Tlaxcala", "Chilpancingo", "Ciudad Victoria", "Xalapa"],
  },
  {
    name: "Micronesia",
    code: "FM",
    cities: ["Palikir", "Weno", "Tofol", "Colonia", "Lelu"],
  },
  {
    name: "Moldova",
    code: "MD",
    cities: ["Chișinău", "Tiraspol", "Bălți", "Bender", "Rîbnița", "Cahul", "Ungheni", "Soroca", "Orhei", "Dubăsari", "Comrat", "Edineț", "Căușeni", "Hîncești", "Florești"],
  },
  {
    name: "Monaco",
    code: "MC",
    cities: ["Monaco", "Monte Carlo", "La Condamine", "Fontvieille"],
  },
  {
    name: "Mongolia",
    code: "MN",
    cities: ["Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan", "Mörön", "Bayankhongor", "Ölgii", "Arvaikheer", "Dalandzadgad", "Mandalgovi", "Kharkhorin", "Zuunharaa"],
  },
  {
    name: "Montenegro",
    code: "ME",
    cities: ["Podgorica", "Nikšić", "Herceg Novi", "Pljevlja", "Bijelo Polje", "Cetinje", "Bar", "Budva", "Ulcinj", "Kotor"],
  },
  {
    name: "Morocco",
    code: "MA",
    cities: ["Casablanca", "Fez", "Marrakesh", "Tangier", "Salé", "Meknes", "Rabat", "Oujda", "Kenitra", "Agadir", "Tetouan", "Temara", "Safi", "Mohammedia", "Khouribga", "El Jadida", "Beni Mellal", "Aït Melloul", "Nador", "Taza", "Settat", "Berrechid", "Khemisset", "Inezgane", "Ksar El Kebir", "Larache", "Guelmim", "Khenifra", "Berkane", "Taourirt"],
  },
  {
    name: "Mozambique",
    code: "MZ",
    cities: ["Maputo", "Matola", "Nampula", "Beira", "Chimoio", "Nacala-Porto", "Quelimane", "Tete", "Xai-Xai", "Maxixe", "Lichinga", "Pemba", "Cuamba", "Moatize", "Inhambane"],
  },
  {
    name: "Myanmar",
    code: "MM",
    cities: ["Naypyidaw", "Yangon", "Mandalay", "Mawlamyine", "Bago", "Pathein", "Monywa", "Sittwe", "Meiktila", "Myeik", "Taunggyi", "Thaton", "Lashio", "Pyay", "Hpa-an", "Magway", "Dawei", "Myitkyina", "Pakokku", "Shwebo"],
  },
  {
    name: "Namibia",
    code: "NA",
    cities: ["Windhoek", "Rundu", "Walvis Bay", "Oshakati", "Swakopmund", "Katima Mulilo", "Grootfontein", "Rehoboth", "Otjiwarongo", "Okahandja", "Keetmanshoop", "Tsumeb", "Ondangwa", "Outapi", "Lüderitz"],
  },
  {
    name: "Nauru",
    code: "NR",
    cities: ["Yaren", "Meneng", "Aiwo", "Buada", "Anabar"],
  },
  {
    name: "Nepal",
    code: "NP",
    cities: ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj", "Dharan", "Hetauda", "Janakpur", "Itahari", "Butwal", "Nepalgunj", "Dhangadhi", "Tulsipur", "Siddharthanagar", "Ghorahi", "Bheemdatta", "Bhadrapur", "Tansen"],
  },
  {
    name: "Netherlands",
    code: "NL",
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "s-Hertogenbosch", "Maastricht", "Leiden", "Dordrecht", "Zwolle", "Zoetermeer", "Deventer", "Delft", "Alkmaar", "Venlo", "Westland", "Leeuwarden", "Sittard-Geleen", "Emmen"],
  },
  {
    name: "New Zealand",
    code: "NZ",
    cities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Lower Hutt", "Dunedin", "Palmerston North", "Napier", "Nelson", "Hastings", "Rotorua", "New Plymouth", "Whangarei", "Invercargill", "Whanganui", "Gisborne", "Porirua", "Upper Hutt", "Blenheim"],
  },
  {
    name: "Nicaragua",
    code: "NI",
    cities: ["Managua", "León", "Masaya", "Matagalpa", "Chinandega", "Estelí", "Granada", "Jinotega", "Tipitapa", "Ciudad Sandino", "El Viejo", "Chichigalpa", "Ocotal", "Nueva Guinea", "Juigalpa"],
  },
  {
    name: "Niger",
    code: "NE",
    cities: ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso", "Arlit", "Birni N'Konni", "Tessaoua", "Mirriah", "Diffa", "Tillabéri", "Goure", "Nguigmi"],
  },
  {
    name: "Nigeria",
    code: "NG",
    cities: ["Lagos", "Kano", "Ibadan", "Benin City", "Port Harcourt", "Kaduna", "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Oyo", "Enugu", "Abeokuta", "Abuja", "Sokoto", "Onitsha", "Warri", "Okene", "Calabar", "Uyo", "Asaba", "Makurdi", "Umuahia", "Nnewi", "Akure", "Awka", "Bauchi", "Nguru", "Damaturu", "Gombe", "Jalingo", "Lafia", "Lokoja", "Birnin Kebbi", "Dutse", "Gusau", "Owerri", "Yenagoa"],
  },
  {
    name: "North Korea",
    code: "KP",
    cities: ["Pyongyang", "Hamhung", "Chongjin", "Nampo", "Wonsan", "Sinuiju", "Tanchon", "Kaechon", "Kaesong", "Sariwon", "Haeju", "Hyesan", "Kanggye"],
  },
  {
    name: "North Macedonia",
    code: "MK",
    cities: ["Skopje", "Bitola", "Kumanovo", "Prilep", "Tetovo", "Veles", "Ohrid", "Gostivar", "Strumica", "Kavadarci", "Struga", "Kičevo", "Radoviš", "Negotino", "Debar"],
  },
  {
    name: "Norway",
    code: "NO",
    cities: ["Oslo", "Bergen", "Stavanger", "Trondheim", "Drammen", "Fredrikstad", "Kristiansand", "Sandnes", "Tromsø", "Ålesund", "Tønsberg", "Moss", "Skien", "Porsgrunn", "Bodø", "Sandefjord", "Arendal", "Sarpsborg", "Haugesund", "Karmøy", "Gjøvik", "Larvik", "Hamar", "Askøy", "Halden"],
  },
  {
    name: "Oman",
    code: "OM",
    cities: ["Muscat", "Seeb", "Salalah", "Bawshar", "Sohar", "Suwayq", "Ibri", "Saham", "Barka", "Rustaq", "Musannah", "Khasab", "Nizwa", "Sur", "Bahla"],
  },
  {
    name: "Pakistan",
    code: "PK",
    cities: ["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta", "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana", "Sheikhupura", "Rahimyar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat", "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", "Dera Ismail Khan", "Nawabshah", "Mingora", "Mirpur Khas", "Abbottabad", "Okara", "Chiniot", "Khanewal", "Hafizabad", "Kohat", "Kamoke", "Muzaffargarh", "Turbat", "Khuzdar", "Muzaffarabad", "Mirpur"],
  },
  {
    name: "Palau",
    code: "PW",
    cities: ["Ngerulmud", "Koror", "Meyungs", "Airai", "Melekeok"],
  },
  {
    name: "Palestine",
    code: "PS",
    cities: ["Gaza", "Hebron", "Nablus", "Ramallah", "Jenin", "Tulkarm", "Qalqilya", "Salfit", "Jericho", "Bethlehem", "Khan Yunis", "Rafah", "Beit Lahiya", "Jabalia"],
  },
  {
    name: "Panama",
    code: "PA",
    cities: ["Panama City", "San Miguelito", "Tocumen", "David", "Arraiján", "La Chorrera", "Colón", "Santiago", "Chitré", "Las Tablas", "Penonomé", "Bocas del Toro", "La Palma", "Changuinola"],
  },
  {
    name: "Papua New Guinea",
    code: "PG",
    cities: ["Port Moresby", "Lae", "Arawa", "Mount Hagen", "Popondetta", "Madang", "Kokopo", "Wewak", "Goroka", "Kimbe", "Mendi", "Kavieng", "Kerema", "Lorengau"],
  },
  {
    name: "Paraguay",
    code: "PY",
    cities: ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Capiatá", "Lambaré", "Fernando de la Mora", "Limpio", "Nemby", "Encarnación", "Mariano Roque Alonso", "Pedro Juan Caballero", "Villa Elisa", "Caaguazú", "Concepción", "Villarrica"],
  },
  {
    name: "Peru",
    code: "PE",
    cities: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Chimbote", "Huancayo", "Tacna", "Juliaca", "Ica", "Pucallpa", "Sullana", "Puno", "Ayacucho", "Cajamarca", "Tumbes", "Talara", "Huánuco", "Tarapoto", "Chincha Alta", "Huacho", "Barranca", "Pisco"],
  },
  {
    name: "Philippines",
    code: "PH",
    cities: ["Quezon City", "Manila", "Caloocan", "Davao City", "Cebu City", "Zamboanga City", "Antipolo", "Taguig", "Pasig", "Cagayan de Oro", "Makati", "Valenzuela", "Dasmariñas", "General Santos", "Las Piñas", "Parañaque", "Pasay", "Malabon", "Muntinlupa", "Mandaluyong", "Bacoor", "San Jose del Monte", "Marikina", "Baguio", "Iloilo City", "Bacolod", "Lapu-Lapu", "Mandaue", "Butuan", "Iligan"],
  },
  {
    name: "Poland",
    code: "PL",
    cities: ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice", "Białystok", "Gdynia", "Częstochowa", "Radom", "Sosnowiec", "Toruń", "Kielce", "Gliwice", "Rzeszów", "Zabrze", "Olsztyn", "Bielsko-Biała", "Bytom", "Zielona Góra", "Rybnik", "Ruda Śląska", "Tychy", "Opole", "Gorzów Wielkopolski", "Dąbrowa Górnicza", "Wałbrzych", "Płock", "Elbląg", "Włocławek", "Tarnów", "Chorzów", "Koszalin", "Kalisz", "Legnica", "Grudziądz"],
  },
  {
    name: "Portugal",
    code: "PT",
    cities: ["Lisbon", "Porto", "Braga", "Setúbal", "Funchal", "Coimbra", "Aveiro", "Vila Nova de Gaia", "Amadora", "Almada", "Guimarães", "Sintra", "Viseu", "Cascais", "Loures", "Famalicão", "Matosinhos", "Barcelos", "Faro", "Évora", "Leiria", "Gondomar", "Odivelas", "Santarém", "Barreiro", "Viana do Castelo", "Braga", "Câmara de Lobos", "Montijo", "Entroncamento"],
  },
  {
    name: "Qatar",
    code: "QA",
    cities: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal", "Ash Shamal", "Madinat ash Shamal", "Dukhan", "Al Wukair", "Mesaieed"],
  },
  {
    name: "Romania",
    code: "RO",
    cities: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Bacău", "Pitești", "Sibiu", "Târgu Mureș", "Baia Mare", "Buzău", "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava", "Focșani", "Târgoviște", "Reșița", "Bistrița", "Piatra Neamț", "Deva", "Petroșani", "Slatina"],
  },
  {
    name: "Russia",
    code: "RU",
    cities: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk", "Barnaul", "Irkutsk", "Ulyanovsk", "Khabarovsk", "Yaroslavl", "Vladivostok", "Makhachkala", "Tomsk", "Orenburg", "Novokuznetsk", "Kemerovo", "Ryazan", "Astrakhan", "Penza", "Lipetsk", "Tula", "Kirov", "Cheboksary", "Balashikha", "Kaliningrad", "Bryansk", "Ivanovo", "Kursk", "Ulan-Ude", "Magnitogorsk", "Tver", "Stavropol", "Nizhny Tagil", "Belgorod", "Arkhangelsk", "Vladimir", "Sochi", "Murmansk", "Kaluga", "Smolensk", "Vologda", "Yakutsk", "Surgut"],
  },
  {
    name: "Rwanda",
    code: "RW",
    cities: ["Kigali", "Butare", "Gitarama", "Ruhengeri", "Gisenyi", "Byumba", "Cyangugu", "Rwamagana", "Kibungo", "Nyanza"],
  },
  {
    name: "Saint Kitts and Nevis",
    code: "KN",
    cities: ["Basseterre", "Charlestown", "Sandy Point Town", "Gingerland", "Newcastle"],
  },
  {
    name: "Saint Lucia",
    code: "LC",
    cities: ["Castries", "Bisée", "Gros Islet", "Vieux Fort", "Laborie", "Soufrière", "Micoud", "Choiseul"],
  },
  {
    name: "Saint Vincent and the Grenadines",
    code: "VC",
    cities: ["Kingstown", "Georgetown", "Barrouallie", "Chateaubelair", "Layou", "Port Elizabeth"],
  },
  {
    name: "Samoa",
    code: "WS",
    cities: ["Apia", "Vaitele", "Faleula", "Asau", "Mulifanua", "Safotulafai", "Samamea"],
  },
  {
    name: "San Marino",
    code: "SM",
    cities: ["City of San Marino", "Serravalle", "Borgo Maggiore", "Domagnano", "Fiorentino", "Acquaviva", "Montegiardino"],
  },
  {
    name: "Sao Tome and Principe",
    code: "ST",
    cities: ["São Tomé", "Santo António", "Neves", "Santana", "Trindade"],
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Buraidah", "Khamis Mushait", "Abha", "Jubail", "Taif", "Hafar Al-Batin", "Al-Hofuf", "Yanbu", "Sakaka", "Najran", "Jizan", "Ar Rass", "Hail"],
  },
  {
    name: "Senegal",
    code: "SN",
    cities: ["Dakar", "Touba", "Thiès", "Rufisque", "Saint-Louis", "Kaolack", "Mbour", "Ziguinchor", "Diourbel", "Louga", "Tambacounda", "Richard Toll", "Guédiawaye", "Kolda", "Kaffrine"],
  },
  {
    name: "Serbia",
    code: "RS",
    cities: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak", "Novi Pazar", "Kruševac", "Leskovac", "Smederevo", "Šabac", "Užice", "Valjevo", "Jagodina", "Bor", "Zaječar", "Sremska Mitrovica", "Vranje"],
  },
  {
    name: "Seychelles",
    code: "SC",
    cities: ["Victoria", "Anse Boileau", "Beau Vallon", "Grand'Anse", "Takamaka", "Bel Air"],
  },
  {
    name: "Sierra Leone",
    code: "SL",
    cities: ["Freetown", "Kenema", "Koidu", "Bo", "Makeni", "Lunsar", "Port Loko", "Kabala", "Moyamba", "Bonthe"],
  },
  {
    name: "Singapore",
    code: "SG",
    cities: ["Singapore", "Jurong East", "Tampines", "Woodlands", "Bukit Timah", "Bedok", "Yishun", "Queenstown", "Ang Mo Kio", "Toa Payoh"],
  },
  {
    name: "Slovakia",
    code: "SK",
    cities: ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Martin", "Trenčín", "Poprad", "Prievidza", "Zvolen", "Považská Bystrica", "Michalovce", "Nové Zámky", "Spišská Nová Ves", "Levice", "Komárno", "Humenne"],
  },
  {
    name: "Slovenia",
    code: "SI",
    cities: ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik", "Nova Gorica", "Jesenice", "Domžale", "Škofja Loka", "Murska Sobota"],
  },
  {
    name: "Solomon Islands",
    code: "SB",
    cities: ["Honiara", "Gizo", "Auki", "Kirakira", "Buala", "Tulagi"],
  },
  {
    name: "Somalia",
    code: "SO",
    cities: ["Mogadishu", "Hargeisa", "Berbera", "Bosaso", "Kismayo", "Marka", "Baidoa", "Gaalkacyo", "Beledweyne", "Burao", "Garowe", "Jowhar", "Jilib", "Afgooye"],
  },
  {
    name: "South Africa",
    code: "ZA",
    cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Nelspruit", "Kimberley", "Polokwane", "Pietermaritzburg", "Rustenburg", "Witbank", "Vereeniging", "Vanderbijlpark", "Soweto", "Tembisa", "Umlazi", "Katlehong", "Midrand", "Ekurhuleni", "Benoni", "Alberton", "Boksburg", "Springs", "Klerksdorp", "Welkom", "Uitenhage", "George", "Bhisho"],
  },
  {
    name: "South Korea",
    code: "KR",
    cities: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Seongnam", "Goyang", "Bucheon", "Cheongju", "Jeonju", "Changwon", "Ansan", "Yongin", "Pohang", "Anyang", "Masan", "Uijeongbu", "Cheonan", "Jinju", "Gumi", "Namyangju", "Hwaseong", "Gimhae", "Jeju City", "Gunsan", "Asan", "Yangsan"],
  },
  {
    name: "South Sudan",
    code: "SS",
    cities: ["Juba", "Wau", "Malakal", "Yei", "Aweil", "Yambio", "Torit", "Bentiu", "Bor", "Rumbek"],
  },
  {
    name: "Spain",
    code: "ES",
    cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas de Gran Canaria", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Hospitalet de Llobregat", "La Coruña", "Vitoria-Gasteiz", "Granada", "Elche", "Oviedo", "Badalona", "Cartagena", "Terrassa", "Jerez de la Frontera", "Sabadell", "Santa Cruz de Tenerife", "Pamplona", "Almería", "Fuenlabrada", "Leganés", "San Sebastián", "Burgos", "Santander", "Albacete", "Alcalá de Henares", "Castellón de la Plana", "Getafe", "Logroño", "Huelva", "Badajoz", "Salamanca"],
  },
  {
    name: "Sri Lanka",
    code: "LK",
    cities: ["Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Jaffna", "Negombo", "Kandy", "Sri Jayawardenepura Kotte", "Kalmunai", "Vavuniya", "Galle", "Trincomalee", "Batticaloa", "Matara", "Puttalam", "Ratnapura", "Anuradhapura", "Badulla", "Kurunegala", "Avissawella", "Nuwara Eliya"],
  },
  {
    name: "Sudan",
    code: "SD",
    cities: ["Khartoum", "Omdurman", "Khartoum North", "Kassala", "Port Sudan", "El Obeid", "Gedaref", "Kassala", "Wad Madani", "Al-Fasher", "Kosti", "Nyala", "El Daein", "Rabak", "Singa"],
  },
  {
    name: "Suriname",
    code: "SR",
    cities: ["Paramaribo", "Lelydorp", "Nieuw Nickerie", "Moengo", "Nieuw Amsterdam", "Marienburg", "Albina"],
  },
  {
    name: "Sweden",
    code: "SE",
    cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Sollentuna", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", "Södertälje", "Eskilstuna", "Halmstad", "Växjö", "Karlstad", "Sundsvall", "Östersund", "Trollhättan", "Borlänge", "Falun", "Kalmar", "Kristianstad", "Skövde", "Uddevalla", "Karlskrona"],
  },
  {
    name: "Switzerland",
    code: "CH",
    cities: ["Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel/Bienne", "Thun", "Köniz", "La Chaux-de-Fonds", "Schaffhausen", "Fribourg", "Chur", "Neuchâtel", "Vernier", "Uster", "Sion", "Lancy", "Yverdon-les-Bains", "Emmen", "Zug", "Kriens", "Regensdorf", "Riehen", "Onex", "Arlesheim", "Kloten"],
  },
  {
    name: "Syria",
    code: "SY",
    cities: ["Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Ar-Raqqah", "Tartus", "Idlib", "Daraa", "Al-Hasakah", "Qamishli", "Suwayda", "Douma", "Palmyra"],
  },
  {
    name: "Taiwan",
    code: "TW",
    cities: ["Taipei", "Kaohsiung", "Taichung", "Tainan", "Hsinchu", "Keelung", "Zhongli", "Xinzhuang", "Banqiao", "Sanzhong", "Yonghe", "Zhonghe", "Luzhou", "Shulin", "Tucheng", "Taoyuan", "Pingtung", "Changhua", "Chiayi", "Hualien"],
  },
  {
    name: "Tajikistan",
    code: "TJ",
    cities: ["Dushanbe", "Khujand", "Kulob", "Qŭrghonteppa", "Istaravshan", "Tursunzoda", "Konibodom", "Panjakent", "Norak", "Vahdat"],
  },
  {
    name: "Tanzania",
    code: "TZ",
    cities: ["Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Mbeya", "Morogoro", "Tanga", "Kahama", "Tabora", "Zanzibar City", "Kigoma", "Sumbawanga", "Singida", "Lindi", "Mtwara", "Shinyanga", "Musoma", "Bukoba", "Iringa", "Songea"],
  },
  {
    name: "Thailand",
    code: "TH",
    cities: ["Bangkok", "Nonthaburi", "Pak Kret", "Hat Yai", "Chiang Mai", "Udon Thani", "Ubon Ratchathani", "Surat Thani", "Nakhon Ratchasima", "Khon Kaen", "Chon Buri", "Nakhon Si Thammarat", "Pattaya", "Samut Prakan", "Samut Sakhon", "Pathum Thani", "Rangsit", "Si Racha", "Rayong", "Songkhla", "Nakhon Pathom", "Ayutthaya", "Phra Nakhon Si Ayutthaya", "Phitsanulok", "Lampang", "Chiang Rai", "Sakon Nakhon", "Nakhon Sawan", "Suphan Buri", "Phetchaburi"],
  },
  {
    name: "Timor-Leste",
    code: "TL",
    cities: ["Dili", "Baucau", "Maliana", "Suai", "Liquiçá", "Same", "Ainaro", "Gleno"],
  },
  {
    name: "Togo",
    code: "TG",
    cities: ["Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé", "Tsévié", "Aného", "Mango", "Dapaong", "Bassar"],
  },
  {
    name: "Tonga",
    code: "TO",
    cities: ["Nuku'alofa", "Neiafu", "Haveluloto", "Vaini", "Pangai"],
  },
  {
    name: "Trinidad and Tobago",
    code: "TT",
    cities: ["Port of Spain", "San Fernando", "Arima", "Chaguanas", "Point Fortin", "Scarborough", "Sangre Grande", "Couva", "Princes Town", "Rio Claro"],
  },
  {
    name: "Tunisia",
    code: "TN",
    cities: ["Tunis", "Sfax", "Sousse", "Ettadhamen", "Kairouan", "Bizerte", "Gabès", "Ariana", "Gafsa", "Monastir", "Beja", "Jendouba", "El Kef", "Mahdia", "Sidi Bouzid", "Kasserine", "Medenine", "Nabeul", "Tataouine", "Tozeur"],
  },
  {
    name: "Turkey",
    code: "TR",
    cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Kayseri", "Mersin", "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Trabzon", "Şanlıurfa", "Adapazarı", "Malatya", "Kahramanmaraş", "Erzurum", "Van", "Batman", "Elazığ", "Manisa", "Gebze", "Balıkesir", "Tekirdağ", "Kocaeli", "Ordu", "Sivas", "Rize", "Aksaray", "Çorum", "Tokat", "Aydın", "Muğla", "Mardin", "Hatay", "Karabük", "Uşak"],
  },
  {
    name: "Turkmenistan",
    code: "TM",
    cities: ["Ashgabat", "Türkmenabat", "Daşoguz", "Mary", "Balkanabat", "Bayramaly", "Türkmenbaşy", "Tejen", "Serdar", "Abadan"],
  },
  {
    name: "Tuvalu",
    code: "TV",
    cities: ["Funafuti", "Savave", "Tanrake", "Toga", "Asau"],
  },
  {
    name: "Uganda",
    code: "UG",
    cities: ["Kampala", "Gulu", "Lira", "Mbarara", "Jinja", "Bwizibwera", "Mbale", "Mukono", "Kasese", "Masaka", "Arua", "Entebbe", "Njeru", "Fort Portal", "Soroti", "Hoima", "Kabale", "Tororo", "Kitgum", "Masindi"],
  },
  {
    name: "Ukraine",
    code: "UA",
    cities: ["Kyiv", "Kharkiv", "Odessa", "Dnipro", "Donetsk", "Zaporizhzhia", "Lviv", "Kryvyi Rih", "Mykolaiv", "Mariupol", "Luhansk", "Vinnytsia", "Sevastopol", "Kherson", "Poltava", "Chernihiv", "Cherkasy", "Sumy", "Zhytomyr", "Khmelnytskyi", "Kirovohrad", "Rivne", "Ivano-Frankivsk", "Ternopil", "Lutsk", "Uzhhorod", "Chernivtsi", "Simferopol", "Makiivka", "Horlivka"],
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Dhaid"],
  },
  {
    name: "United Kingdom",
    code: "GB",
    cities: ["London", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Manchester", "Edinburgh", "Liverpool", "Bristol", "Cardiff", "Wakefield", "Coventry", "Nottingham", "Leicester", "Sunderland", "Belfast", "Newcastle upon Tyne", "Brighton", "Hull", "Plymouth", "Stoke-on-Trent", "Wolverhampton", "Derby", "Swansea", "Southampton", "Salford", "Aberdeen", "Westminster", "Portsmouth", "Oxford", "Cambridge", "Reading", "Northampton", "Luton", "Peterborough", "Middlesbrough", "Huddersfield", "Milton Keynes", "Ipswich", "Dudley", "York", "Inverness", "Bath", "Exeter", "Gloucester", "Norwich", "Bournemouth", "Dundee", "Perth", "Stirling", "St Andrews", "Derry"],
  },
  {
    name: "United States",
    code: "US",
    cities: ["New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco", "Seattle", "Denver", "Nashville", "Oklahoma City", "El Paso", "Washington", "Las Vegas", "Boston", "Memphis", "Louisville", "Portland", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Mesa", "Kansas City", "Atlanta", "Omaha", "Colorado Springs", "Raleigh", "Long Beach", "Virginia Beach", "Minneapolis", "Tampa", "New Orleans", "Arlington", "Bakersfield", "Honolulu", "Anaheim", "Aurora", "Santa Ana", "Corpus Christi", "Riverside", "Lexington", "St. Louis", "Pittsburgh", "Stockton", "Anchorage", "Cincinnati", "St. Paul", "Greensboro", "Toledo", "Newark", "Plano", "Henderson", "Lincoln", "Buffalo", "Fort Wayne", "Jersey City", "Chula Vista", "Orlando", "St. Petersburg", "Norfolk", "Chandler", "Laredo", "Madison", "Durham", "Lubbock", "Winston-Salem", "Garland", "Glendale", "Hialeah", "Reno", "Baton Rouge", "Irvine", "Chesapeake", "Irving", "Scottsdale", "North Las Vegas", "Fremont", "Gilbert", "San Bernardino", "Birmingham", "Rochester", "Richmond", "Spokane", "Des Moines", "Montgomery", "Modesto", "Fayetteville", "Tacoma", "Shreveport", "Fontana", "Akron", "Moreno Valley", "Glendale", "Huntington Beach", "Little Rock", "Columbus", "Augusta", "Grand Rapids", "Salt Lake City", "Tallahassee", "Huntsville", "Worcester", "Knoxville", "Newport News", "Providence", "Santa Clarita", "Garden Grove", "Chattanooga", "Oceanside", "Fort Lauderdale", "Rancho Cucamonga", "Tempe", "Santa Rosa", "Cape Coral", "Ontario", "Vancouver", "Sioux Falls", "Peoria", "Jackson", "Elk Grove", "Salinas", "Palmdale", "Corona", "Kansas City", "Springfield", "Alexandria", "Hayward", "Clarksville", "Lancaster", "Macon", "Sunnyvale", "Pomona", "Escondido", "Savannah", "Torrance", "Paterson", "Bridgeport", "McAllen", "Syracuse", "Surprise", "Hollywood"],
  },
  {
    name: "Uruguay",
    code: "UY",
    cities: ["Montevideo", "Salto", "Ciudad de la Costa", "Paysandú", "Las Piedras", "Rivera", "Maldonado", "Tacuarembó", "Melo", "Mercedes", "Artigas", "Minas", "San José de Mayo", "Durazno", "Florida"],
  },
  {
    name: "Uzbekistan",
    code: "UZ",
    cities: ["Tashkent", "Namangan", "Samarkand", "Andijan", "Fergana", "Bukhara", "Nukus", "Qarshi", "Kokand", "Jizzakh", "Chirchiq", "Termez", "Margilan", "Urgench", "Navoi", "Angren", "Olmaliq", "Gulistan", "Zarafshon"],
  },
  {
    name: "Vanuatu",
    code: "VU",
    cities: ["Port Vila", "Luganville", "Isangel", "Sola", "Lakatoro"],
  },
  {
    name: "Vatican City",
    code: "VA",
    cities: ["Vatican City"],
  },
  {
    name: "Venezuela",
    code: "VE",
    cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Ciudad Guayana", "Barcelona", "Maturín", "Maracay", "Cumaná", "Ciudad Bolívar", "Turmero", "San Cristóbal", "Mérida", "Acarigua", "Barinas", "Cabimas", "Punto Fijo", "Coro", "Puerto Cabello", "San Felipe", "Guanare", "Los Teques", "Guarenas", "Valera", "Porlamar"],
  },
  {
    name: "Vietnam",
    code: "VN",
    cities: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", "Bien Hoa", "Hue", "Nha Trang", "Buon Ma Thuot", "Quy Nhon", "Long Xuyen", "Da Lat", "Rach Gia", "Vung Tau", "My Tho", "Vinh", "Nam Dinh", "Phan Thiet", "Thai Nguyen", "Ca Mau", "Ha Long", "Bac Ninh", "Bac Giang", "Thai Binh", "Thanh Hoa", "Dong Hoi", "Quang Ngai", "Kon Tum", "Pleiku", "Tuy Hoa"],
  },
  {
    name: "Yemen",
    code: "YE",
    cities: ["Sanaa", "Aden", "Taiz", "Al Hudaydah", "Ibb", "Dhamar", "Mukalla", "Hajjah", "Saada", "Amran", "Zabid", "Bayda", "Al Mukha", "Zinjibar", "Marib"],
  },
  {
    name: "Zambia",
    code: "ZM",
    cities: ["Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira", "Livingstone", "Luanshya", "Kasama", "Chipata", "Kalulushi", "Mazabuka", "Mongu", "Kafue", "Chililabombwe"],
  },
  {
    name: "Zimbabwe",
    code: "ZW",
    cities: ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Epworth", "Gweru", "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi", "Norton", "Marondera", "Ruwa", "Chegutu", "Zvishavane"],
  },
];

export const countries: Country[] = _raw.map((c) => ({ ...c, flag: codeToFlag(c.code) }));

export const getCitiesByCountryCode = (code: string): string[] => {
  const country = countries.find((c) => c.code === code);
  return country ? country.cities : [];
};

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find((c) => c.code === code);
};

/**
 * Given a stored location string ("City, Country" or "Country"),
 * returns the flag emoji for that country.
 */
export const getLocationFlag = (location: string | null | undefined): string => {
  if (!location) return '';
  // Try to match the country portion (after the last comma, or the whole string)
  const parts = location.split(',');
  const countryName = parts[parts.length - 1].trim();
  const country = countries.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );
  return country ? country.flag : '';
};
