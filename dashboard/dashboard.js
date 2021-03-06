//Function that sends query to Wikidata SPARQL endpoint and returns json response
async function wikidataQuery(query){
	const url = `https://query.wikidata.org/sparql?query=${encodeURI(query)}&format=json`
	let response = await (await fetch(url)).json()
	return response
}

/***GAMES***/
let AnswerSmash = new Vue({
	el: '#AnswerSmash',
	data: {
		currentGame: true,
		queries: {
			famous_people_US: `
				SELECT ?item ?itemLabel ?itemDescription (MIN(?img) as ?image) ?fame  {
					?item wdt:P31 wd:Q5; wdt:P27 wd:Q30; wdt:P18 ?img; wikibase:sitelinks ?fame. FILTER(?fame>100)
					SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?fame ?image ?itemDescription
				ORDER BY DESC(?fame) ?itemLabel
				LIMIT 5000
			`,
			famous_people_NZ: `
				SELECT ?item ?itemLabel ?itemDescription (MIN(?img) as ?image) ?fame  {
					?item wdt:P31 wd:Q5; wdt:P27 wd:Q664; wdt:P18 ?img; wikibase:sitelinks ?fame. FILTER(?fame>10)
					SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?fame ?image ?itemDescription
				ORDER BY DESC(?fame) ?itemLabel
				LIMIT 5000
			`,
			famous_people_UK: `
				SELECT ?item ?itemLabel ?itemDescription (MIN(?img) as ?image) ?fame  {
					?item wdt:P31 wd:Q5; wdt:P27 wd:Q145; wdt:P18 ?img; wikibase:sitelinks ?fame. FILTER(?fame>20)
					SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?fame ?image ?itemDescription
				ORDER BY DESC(?fame) ?itemLabel
				LIMIT 5000
			`,
			brands: `
			SELECT ?item ?itemLabel ?itemDescription ?image{{
				SELECT ?item ?itemLabel ?itemDescription (MIN(?img) as ?image) WHERE {
				  ?item wdt:P31 wd:Q431289; wdt:P18 ?img.
				  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?image ?itemDescription
				ORDER BY ?itemLabel
				LIMIT 10000
				}FILTER lang(?itemLabel)}
			`,
			foods: `
			SELECT ?item ?itemLabel ?itemDescription ?image{{
				SELECT ?item ?itemLabel (MIN(?img) as ?image) WHERE {
				?item wdt:P31/wdt:P279* wd:Q209; wdt:P18 ?img.
				SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?itemDescription ?fame ?image
				ORDER BY ?itemLabel
				LIMIT 10000
				}FILTER lang(?itemLabel)}
			`
		},
		category1: '',
		category2: '',
		overlap: 3,
	},
	methods: {
		overlaps(list1, list2, overlap){
			//Find Overlaps
			result = []
			for(item1 of list1) for(item2 of list2){
				if(item1.label.substr(item1.label.length - overlap) == item2.label.substr(0, overlap)){
					result.push({answer:item1.label + item2.label.substr(overlap), item1:item1, item2:item2})
				}
			}
			return result
		},
		async runQueries(){
			//change the cursor to a waiting cursor
			document.body.style.cursor = 'wait';
			let response1 = await wikidataQuery(this.queries[this.category1])
			let response2 = await wikidataQuery(this.queries[this.category2])
			
			let list1 = []
			for(item of response1.results.bindings){
				let label = item.itemLabel.value.toLowerCase() 
				let image = item.image?.value 
				let description = item.itemDescription?.value
				list1.push({label:label, image:image, description:description})
			}
			
			let list2 = []
			for(item of response2.results.bindings){
				let label = item.itemLabel.value.toLowerCase() 
				let image = item.image?.value 
				let description = item.itemDescription?.value
				list2.push({label:label, image:image, description:description})
			}

			//Find Overlaps
			results.$data.options = this.overlaps(list1, list2, this.overlap)

			//return the cursor back to normal
			document.body.style.cursor = 'default';
		}
	}
})
let WhereIsKazakhstan = new Vue({
	el: '#WhereIsKazakhstan',
	data: {
		currentGame: false,
		query: `
			SELECT DISTINCT ?city ?cityLabel ?country ?countryLabel
			WHERE 
			{
			?city wdt:P31 wd:Q515; wdt:P17 ?country
			SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
			}
			LIMIT 1000
		`
	},
	methods: {
		async runQueries(){
			//change the cursor to a waiting cursor
			document.body.style.cursor = 'wait';

			const response = await wikidataQuery(this.query)
			let options = []
			for(result of response.results.bindings){
				const city = result.cityLabel.value
				const country = result.countryLabel.value
				options.push({answer:city, item1: {label: city}, item2: {label: country}} )
			}
			results.$data.options = options

			//return the cursor back to normal
			document.body.style.cursor = 'default';
		}
	}
})
let DistinctlyAverage = new Vue({
	el: '#DistinctlyAverage',
	data: {
		currentGame: false,
		query: 'countries',
		queries: {
			countries: `
				SELECT DISTINCT ?itemLabel (MAX(?Inception) as ?inception) ?lifeExpectancy ?population ?area ?retirementAge ?medianIncome
				{
					?item wdt:P31 wd:Q6256.
					OPTIONAL {?item wdt:P571 ?Inception.}
					OPTIONAL {?item wdt:P2250 ?lifeExpectancy.}
					OPTIONAL {?item wdt:P1082 ?population.}
					OPTIONAL {?item wdt:P2046 ?area.}
					OPTIONAL {?item wdt:P3001 ?retirementAge.}
					OPTIONAL {?item wdt:P3529 ?medianIncome.}
					SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				}
				GROUP BY ?item ?itemLabel ?inception ?lifeExpectancy ?population ?area ?retirementAge ?medianIncome
				ORDER BY ?itemLabel
			`,
		}
	},
	methods: {
		async runQueries(){
			//change the cursor to a waiting cursor
			document.body.style.cursor = 'wait';

			const response = await wikidataQuery(this.queries[this.query])
			let vars = response.head.vars
			let bindings = response.results.bindings

			let options = []
			for(b of bindings){
				let obj = {}
				for(v of vars){
					obj[v] = b[v]?.value
				}
				options.push(obj)
			}

			results.$data.options = options

			//return the cursor back to normal
			document.body.style.cursor = 'default';
		}
	}
})

let games = {
	AnswerSmash,
	WhereIsKazakhstan,
	DistinctlyAverage,
}

let selectedGame = 'AnswerSmash'
let gameSelection = new Vue({
	el: '#game-selection',
	data: {
		games: Object.keys(games)
	},
	methods: {
		changeGame(game){
			selectedGame = game
			results.$data.currentGame = game
			selected.$data.currentGame = game
			for(key of Object.keys(games)) games[key].$data.currentGame = key == game ? true : false

			//clear the results and selected
			results.$data.options = []
			selected.$data.selected = []
		}
	}
})


Vue.component('result',{
	props: ['option'],
	template: '<div class="option"><input type="button" value="+" v-on:click="add(option)"><p>{{option.answer}} ({{option.item1.label}}, {{option.item2.label}})</p></div>'
})

Vue.component('distinctly-average-result',{
	props: ['option', 'index'],
	template: `
	<div class="option"><input type="button" value="+" v-on:click="add(option)">
		<p>{{option.itemLabel}}</p>
		<p>{{index}}</p>
	</div>`
})

//The results list
let results = new Vue({
	el: '#results',
	data: {
		currentGame: 'AnswerSmash',
		options: [{value:'asdasd', item1:{label:'item1'}, item2:{label:'item2'}}],
	}
})

//adds item from results list to the selected list 
function add(item){
	selected.$data.selected.push(item)

	//also remove it from the results
	var index = results.$data.options.indexOf(item);
	if (index !== -1) {
		results.$data.options.splice(index, 1);
	}
}

//removes a selected item
function remove(item){
	//https://stackoverflow.com/questions/3954438/how-to-remove-item-from-array-by-value
	var index = selected.$data.selected.indexOf(item);
	if (index !== -1) {
		selected.$data.selected.splice(index, 1);
	}
}

Vue.component('selection',{
	props: ['option'],
	template: '<div class="option"><input type="button" value="-" v-on:click="remove(option)"><p>{{option.value}} ({{option.item1.label}}, {{option.item2.label}})</p></div>'
})

Vue.component('distinctly-average-selection',{
	props: ['option'],
	template: '<div class="option"><input type="button" value="-" v-on:click="remove(option)"><p>{{option.itemLabel}}</p></div>'
})

//list of selected items
let selected = new Vue({
	el: '#selected',
	data:{
		currentGame: 'AnswerSmash',
		selected: [],
	},
})

// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#supplying_request_options
//sends a post request to /database
async function save(){
	const url = '/database'
	
	const headers = {
		'Content-Type': 'application/json',
		'game': selectedGame //custom request header so that the server knows which game to update in the database
	}
	const response = await fetch(url, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(selected.$data.selected)
	})
	alert(await response.text())
}
