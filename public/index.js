const to_user_profile = () => {
	const form = document.getElementById("nav_searchbar");
	const username = form.elements.namedItem("username").value;
	window.location = `http://localhost:3000/user/${username}`;
};

const set_selected = () => {
	const selectDropdowns = document.getElementsByTagName("select");
	for (const select of selectDropdowns) {
		const targetValue = select.getAttribute("target");
		for (let i = 0; i < select.children.length; i++) {
			const option = select.children[i];
			const optionValue = option.value;
			if (optionValue === targetValue) {
				option.setAttribute("selected", true);
				break;
			}
		}
	}
};
window.onload = set_selected();
