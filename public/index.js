const to_user_profile = () => {
	const form = document.getElementById("nav_searchbar");
	const username = form.elements.namedItem("username").value;
	console.log(username);
	window.location = `http://localhost:3000/${username}`;
};
