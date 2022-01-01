//Unique Indexes
CREATE CONSTRAINT UniqueMovie ON (a:Movie) ASSERT a.movieId IS UNIQUE;
CREATE CONSTRAINT UniqueLetterboxdId ON (a:Movie) ASSERT a.letterboxd_id IS UNIQUE;
CREATE CONSTRAINT UniqueLanguage ON (c:Language) ASSERT c.name IS UNIQUE;
CREATE CONSTRAINT UniqueCompany ON (c:Company) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT UniqueKeyword ON (d:Keyword) ASSERT d.id IS UNIQUE;
CREATE CONSTRAINT UniqueGenre ON (g:Genre) ASSERT g.id IS UNIQUE;
CREATE CONSTRAINT UniqueCountry ON (l:Country) ASSERT l.name IS UNIQUE;
CREATE CONSTRAINT UniquePerson ON (p:Person) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT UniqueUser ON (a:User) ASSERT a.userId IS UNIQUE;
CREATE CONSTRAINT UniquePref ON (a:Pref) ASSERT a.userId IS UNIQUE;
CREATE CONSTRAINT UniqueNotFound ON (a:NotFound) ASSERT a.movieId IS UNIQUE;
CREATE CONSTRAINT UniqueIgnore ON (a:Ignore) ASSERT a.movieId IS UNIQUE;