import json

with open("BC_Compendium.json", "r") as file: #opens JSON path as read
    index = json.load(file) #loads json file
    clist = index["subclasses"]
    blist = index["black company"]
    
    print("Welcome to Black Company, ye' cunts. Look around, but don't touch nothin\n")
    for c in index.keys():
        print(c.title())
    print("\nVersion 1.0")
    
    choice= input("Please select from the list, ye cunt.", ).strip().lower() #strip removes space, lower forces lowercase
    if choice.lower() == "subclasses":
        for c in clist.keys():
            print(c.title())
        choice= input("\nChoose a subclass, ye cunt.", ).strip().lower()
        for key in clist.keys(): #cycles through the dictionary
            if key.lower() == choice: #this line is not solid, but makes sense
                print(f'\nSubclass: {choice.title()}') #print choice name
                print(f'\nDescription: {clist[key]["description"]}') #print
                print("\nFeatures:") 
                for feat in clist[key]["features"]:
                    print(f'\n{clist[key]["features"][feat]["name"]}')
                    print(f'{clist[key]["features"][feat]["description"]}')
    elif choice.lower() == "black company":
            for c in blist.keys():
                print(c.title())
            choice= input("\nChoose, ye cunt.", ).strip().lower()
            if choice == "brother":
                print(f'\nDescription: {blist["brother"]["description"]}\n') 
                print("Features:") 
                for feat in blist["brother"]["features"]:
                    print(f'\n{blist["brother"]["features"][feat]["name"]}')
                    print(f'{blist["brother"]["features"][feat]["description"]}')
            elif choice == "traits" or choice == "quirks":
                print(f'\n{choice.title()}:\n')
                for t in blist[choice]:
                    print(f'\n{blist[choice][t]["name"]}:')
                    print(blist[choice][t]["description"])

    
    