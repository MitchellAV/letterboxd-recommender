# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %%
import json
import os,glob
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel 


# %%
folder_path = 'json/database/'
movie_database = []
for filename in glob.glob(os.path.join(folder_path, '*.json')):
    with open(filename, 'r',encoding="utf8") as f:
        jsonFile = json.load(f)['posts']
        movie_list = []
        for movie in jsonFile:
            genres = ''
            filtered_json = {}
            for genre in movie['genres']:
                genres += genre['name'].replace(' ', '') + " "
            filtered_json['id'] = movie['id']
            filtered_json['title'] = movie['title']
            filtered_json['genres'] = genres
            filtered_json['overview'] = movie["overview"]
            filtered_json['imdb_id'] = movie["imdb_id"]
            movie_list.append(filtered_json)                
        movie_database = [ *movie_database,*movie_list]
        
with open('json/users/ropeiscut-movies.json', encoding="utf8") as f:
    user_database = json.load(f)
user_database = user_database['movies'] 


# %%
movie_df = pd.DataFrame.from_dict(movie_database,orient='columns')
movie_df = movie_df[['id','title','genres','overview']]
movie_df['id'].replace('', np.nan, inplace=True)
movie_df.dropna(subset=['id'], inplace=True)
movie_df.id = movie_df.id.astype('float').astype('Int32')



user_df = pd.DataFrame.from_dict(user_database,orient='columns')
user_df = user_df[['id']]
user_df['id'].replace('', np.nan, inplace=True)
user_df.dropna(subset=['id'], inplace=True)
user_df.id = user_df.id.astype('float').astype('Int32')
user_df = user_df.merge(movie_df,on="id",how='inner')


# %%
tf = TfidfVectorizer(analyzer='word',ngram_range=(1,2),stop_words="english")
tfidf_matrix = tf.fit_transform(movie_df['overview'])


# %%
cosine_similarities = linear_kernel(tfidf_matrix, tfidf_matrix) 


# %%
indices = pd.DataFrame(movie_df[['title','id']])
indices.index = movie_df.index


# %%
# results = {}
# for idx, row in movie_df.iterrows():
#    similar_indices = cosine_similarities[idx].argsort()[:-100:-1] 
#    similar_items = [(cosine_similarities[idx][i], movie_df['id'][i]) for i in similar_indices] 
#    results[row['id']] = similar_items[1:]


# %%
# Function that takes in movie title as input and outputs most similar movies
def get_recommendations(id, n,cosine_sim=cosine_similarities):
    # Get the index of the movie that matches the id
    idx = indices[indices['id']==id].index.values[0]

    # Get the pairwsie similarity scores of all movies with that movie
    sim_scores = list(enumerate(cosine_similarities[idx]))

    # Sort the movies based on the similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # Get the scores of the 10 most similar movies
    sim_scores = sim_scores[:n]

    # Get the movie indices
    movie_indices = [i[0] for i in sim_scores]

    # Return the top 10 most similar movies
    return movie_df['title'].iloc[movie_indices]


# %%
get_recommendations(id=122,n=10)


# %%



