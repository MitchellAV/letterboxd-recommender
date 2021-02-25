const to_user_profile = () => {
	const form = document.getElementById("nav_searchbar");
	const username = form.elements.namedItem("username").value;
	console.log(username);
	window.location = `http://localhost:3000/${username}`;
};

const set_selected = () => {
	const selectDropdowns = document.getElementsByTagName("select");
	console.log(selectDropdowns);
	for (const select of selectDropdowns) {
		const targetValue = select.getAttribute("target");
		for (let i = 0; i < select.children.length; i++) {
			const option = select.children[i];
			console.log(option);
			const optionValue = option.value;
			console.log(optionValue, targetValue);
			if (optionValue === targetValue) {
				option.setAttribute("selected", true);
				break;
			}
		}
	}
};
window.onload = set_selected();
