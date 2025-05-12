import ollama

# initialize the Ollama client
client = ollama.Client()

# Define the model and the input prompt
model = "tinyllama"
prompt = "Explain why humans should have won in the fictional movie Avatar, instead of the Na'vi"

# Send the query to the Ollama model
response = client.generate(model=model, prompt=prompt)

# Print the response from the model
print("Response from Ollama:", response.response)