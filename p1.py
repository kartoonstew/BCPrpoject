import json 

try:
    with open("test.JSON", "r") as file:
        index = json.load(file)
except FileNotFoundError:
    print("Compendium file not found. Check the file path.")
    exit()

def display_subclass(char):
    for x in index: #loops first level keys
        for y in index[x]: #loops second level keys
                if char == y or char == y.lower(): #if input is in second level keys
                    print(f'\n{(char.title())}: {index[x][y]["description"]}') #print the title, and description
                    for feat in index[x][y]["features"]: #this loops the features
                        try: #try to print level if it exist
                            print(f'\nLevel: {index[x][y]["features"][feat]["level"]} - {feat.title()}')
                        except KeyError:
                            print(f'\n{feat.title()}') #other wise print the name, features and description
                        print(index[x][y]["features"][feat]["description"])

choice = input("Please select a class. ")
display_subclass(choice)
