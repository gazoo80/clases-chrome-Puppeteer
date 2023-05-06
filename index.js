const puppeteer = require("puppeteer");

// Objeto guia con los campos cuyos valores deseamos extraer 
const configData = {
  'Given name': 'Nombre', // Propiedad entre comillas porque son varias palabras con espacios
  "Father's name": 'Apellido Paterno',
  "Mother's name": 'Apellido Materno',
  Nationality: 'Nacionalidad', // Propiedas sin comillas porque es solo una palabra
  'Personal number': 'Nro. de DNI',
  'Date of registration': 'Fecha de Registro',
  'Date of birth': 'Fecha de Nacimiento',
  Sex: "Sexo",
  Age: "Edad",
  'Marital status': 'Estado Civil'
};

(async (configData) => {
  // Obtenemos una instancia del browser (promesa)
  const browser = await puppeteer.launch({ 
    headless: false, // Sin cabecera
    defaultViewport: null, // Para que el browser y su contenido no aparezca minimizado
    args: [ // Hacemos que el browser aparezca maximizado
      '--start-maximized' // Tambien se puede usar --start-fullscreen
    ]
  });

  // Creamos una nueva página del browser (promesa)
  const page = await browser.newPage();

  // Cargamos en la pagina creada el contenido de un sitio a partir de su URL 
  await page.goto("https://api.regulaforensics.com/?utm_source-docs");

  // Obtenemos de la pagina, especificamente en control para cargar imagenes
  const elementHandle = await page.$('input[type=file]');

  // Cargamso la imagen de un dni en el input type file obtenido anteriormente
  // Esto, según el funcionamiento de la página hará que cargue info del DNI
  await elementHandle.uploadFile('./images/dni.jpg');

  // Esperando a que se formen los selectores con los que vamos a trabajar
  // para que nuestro script pueda encontrarlos. Sino la ejecucion caera
  await page.waitForSelector('tbody > tr');

  // Evaluando el contenido de la página (la info obtenida del DNI cargado)
  // Para hacer scraping
  const dniInformation = await page.evaluate((configData) => {
    // Obtenemos todas las filas del cuerpo de la tabla y lo transformamos en arreglo
    const rowElements = [...document.querySelectorAll('tbody > tr')] ;

    // Transformamos el contenido que necesitamos de la fila en un arreglo de objetos
    // con las propiedades { fieldType, MRZ, visualZone }
    const dniCardInformation = rowElements.map((row) => {
      const [{innerText: fieldType}, {innerText: MRZ}, {innerText: visualZone}] = row.children;
      
      return { fieldType, MRZ, visualZone };
    });

    // Transfromamos el contenido de dniCardInformation al formato que deseamos "campo: valor"
    const dniInfoByField = dniCardInformation
      // Filtramos solo los campos que necesitamos según nuestro objeto guía
      // consultando si el campo o propiedad existe en el objeto configData
      // https://www.w3schools.com/jsref/jsref_operators.asp
      .filter((item) => item.fieldType in configData)
      // Transformamos los onjetod del arreglo. Ahora tendran solo dos propiedades. Field contendra
      // el nombre del campo en español segun el objeto guia y value contendra el valor para "field"
      // segun visualZone tenga valor o no (uso de operador logico OR de corto circuito)
      .map((item) => {
        return {
          field: configData[item.fieldType], // Obtenemos el nombre en español
          value: item.visualZone || item.MRZ // Valor para el campo
        }
      })
      // Reducimos el arreglo con todos sus objetos a un solo objeto con la info deseada 
      .reduce((acum, item) => {
          acum[item.field] = item.value.toUpperCase(); // campo = valor
          return acum;
      }, {}); // El segundo parametro nos indica que "acum" inicia como un objeto vacio 
              // https://www.w3schools.com/jsref/jsref_reduce.asp

    // Retornnado un unico obejto obtenido con la informacion deseada
    return dniInfoByField;

  }, configData); // Notar el segundo parametro de .evaluate (NECESARIO PARA QUE FUNCIONE)

  console.log(JSON.stringify(dniInformation, null, '\t'));


  console.log(configData.Age, configData["Mother's name"], configData['Marital status']);
  console.log("Mother's name" in configData, 'Age' in configData, 'hola' in configData);
  
})(configData);
