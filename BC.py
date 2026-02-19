import json

with open("BC_Compendium.json", "r") as file: #opens JSON path
    classes = json.load(file) #loads json file
    clist = classes["subclasses"]
    for c in clist:
        print(c)

    choice= input("Please select a class", ).strip().lower() #strip removes space, lower forces lowercase
    for key in clist.keys(): #cycles through the dictionary
        if key.lower() == choice: #this line is not solid, but makes sense
            print(f'\nSubclass: {choice.title()}') #print choice name
            print(f'\nDescription: {clist[key]["description"]}') #print
            print("\nFeatures:") 
            for feat in clist[key]["features"]:
                print(f'\n{clist[key]["features"][feat]["name"]}')
                print(f'{clist[key]["features"][feat]["description"]}')
    
    